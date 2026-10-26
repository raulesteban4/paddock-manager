package com.paddock.manager.common.exception;

/**
 * Excepción para violaciones de reglas de negocio del taller (HTTP 409 / 422).
 * Ejemplos: stock insuficiente, transición de estado no permitida, etc.
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
