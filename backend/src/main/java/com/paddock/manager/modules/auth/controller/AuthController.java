package com.paddock.manager.modules.auth.controller;

import com.paddock.manager.common.exception.BadRequestException;
import com.paddock.manager.common.response.ApiResponse;
import com.paddock.manager.modules.auth.dto.AuthResponseDto;
import com.paddock.manager.modules.auth.dto.LoginRequestDto;
import com.paddock.manager.modules.user.entity.User;
import com.paddock.manager.modules.user.repository.UserRepository;
import com.paddock.manager.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints de inicio de sesión y verificación de sesión con JWT")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Autentica al usuario y devuelve un token JWT con sus roles y datos de perfil.")
    public ResponseEntity<ApiResponse<AuthResponseDto>> login(@Valid @RequestBody LoginRequestDto request) {
        log.info("Intento de inicio de sesión para el email: {}", request.getEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                    .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

            String token = jwtService.generateToken(userDetails, user.getId(), user.getFullName());

            AuthResponseDto response = AuthResponseDto.builder()
                    .token(token)
                    .type("Bearer")
                    .id(user.getId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole().getName())
                    .build();

            log.info("Inicio de sesión exitoso para: {} ({})", user.getEmail(), user.getRole().getName());
            return ResponseEntity.ok(ApiResponse.success("Inicio de sesión exitoso", response));

        } catch (BadCredentialsException e) {
            log.warn("Credenciales inválidas para: {}", request.getEmail());
            throw new BadRequestException("Credenciales incorrectas: correo o contraseña inválidos");
        }
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener perfil actual", description = "Devuelve los datos del usuario autenticado a partir de su token JWT.")
    public ResponseEntity<ApiResponse<AuthResponseDto>> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BadRequestException("No hay una sesión activa autenticada");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        AuthResponseDto response = AuthResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}