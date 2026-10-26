package com.paddock.manager.common.exception;

/**
 * Excepción lanzada cuando los datos de la petición son incorrectos o malformados (HTTP 400).
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
