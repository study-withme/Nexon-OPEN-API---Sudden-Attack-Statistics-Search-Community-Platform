package com.example.jokerweb.common;

import com.example.jokerweb.auth.exception.DuplicateEmailException;
import com.example.jokerweb.auth.exception.DuplicateNicknameException;
import com.example.jokerweb.auth.exception.DuplicateOuidException;
import com.example.jokerweb.auth.exception.InvalidNicknameException;
import com.example.jokerweb.auth.exception.WeakPasswordException;
import com.example.jokerweb.nexon.NexonApiRateLimitException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("잘못된 요청: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message(ex.getMessage())
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmail(DuplicateEmailException ex) {
        log.warn("중복 이메일: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.builder()
                        .status(HttpStatus.CONFLICT.value())
                        .message(ex.getMessage())
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(DuplicateNicknameException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateNickname(DuplicateNicknameException ex) {
        log.warn("중복 닉네임: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.builder()
                        .status(HttpStatus.CONFLICT.value())
                        .message(ex.getMessage())
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(DuplicateOuidException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateOuid(DuplicateOuidException ex) {
        log.warn("중복 OUID: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.builder()
                        .status(HttpStatus.CONFLICT.value())
                        .message(ex.getMessage())
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(InvalidNicknameException.class)
    public ResponseEntity<ErrorResponse> handleInvalidNickname(InvalidNicknameException ex) {
        log.warn("유효하지 않은 닉네임: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message(ex.getMessage())
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(WeakPasswordException.class)
    public ResponseEntity<ErrorResponse> handleWeakPassword(WeakPasswordException ex) {
        log.warn("약한 비밀번호: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message(ex.getMessage())
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage, (a, b) -> a));
        log.warn("검증 오류: {}", errors);
        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("입력 값이 올바르지 않습니다.")
                        .errors(errors)
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParameter(MissingServletRequestParameterException ex) {
        log.warn("필수 파라미터 누락: {}", ex.getParameterName());
        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("필수 파라미터가 누락되었습니다: " + ex.getParameterName())
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        log.warn("파라미터 타입 불일치: {} = {}", ex.getName(), ex.getValue());
        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("파라미터 타입이 올바르지 않습니다: " + ex.getName())
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleMessageNotReadable(HttpMessageNotReadableException ex) {
        log.warn("요청 본문 읽기 오류: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("요청 본문 형식이 올바르지 않습니다.")
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        log.warn("접근 거부: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.builder()
                        .status(HttpStatus.FORBIDDEN.value())
                        .message("접근 권한이 없습니다.")
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(EmptyResultDataAccessException.class)
    public ResponseEntity<ErrorResponse> handleEmptyResult(EmptyResultDataAccessException ex) {
        log.warn("대상이 존재하지 않음: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.builder()
                        .status(HttpStatus.NOT_FOUND.value())
                        .message("요청한 리소스를 찾을 수 없습니다.")
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorResponse> handleDataAccess(DataAccessException ex) {
        log.error("데이터베이스 오류 발생", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.builder()
                        .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                        .message("데이터베이스 처리 중 오류가 발생했습니다.")
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(HttpClientErrorException.class)
    public ResponseEntity<ErrorResponse> handleHttpClientError(HttpClientErrorException ex) {
        String responseBody = ex.getResponseBodyAsString();
        log.warn("외부 API 오류: {} - {}", ex.getStatusCode(), responseBody);
        
        String message = "외부 API 호출 중 오류가 발생했습니다.";
        if (ex.getStatusCode() == HttpStatus.BAD_REQUEST) {
            if (responseBody != null && responseBody.contains("OPENAPI00004")) {
                message = "해당 데이터를 찾을 수 없습니다. 요청 값을 확인해주세요.";
            } else {
                message = "잘못된 요청입니다. 입력값을 확인해주세요.";
            }
        } else if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
            message = "요청한 리소스를 찾을 수 없습니다.";
        } else if (ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
            message = "인증이 필요합니다.";
        } else if (ex.getStatusCode() == HttpStatus.FORBIDDEN) {
            message = "접근 권한이 없습니다.";
        }
        
        return ResponseEntity.status(ex.getStatusCode())
                .body(ErrorResponse.builder()
                        .status(ex.getStatusCode().value())
                        .message(message)
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(HttpServerErrorException.class)
    public ResponseEntity<ErrorResponse> handleHttpServerError(HttpServerErrorException ex) {
        log.error("외부 API 서버 오류: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ErrorResponse.builder()
                        .status(HttpStatus.BAD_GATEWAY.value())
                        .message("외부 서비스에서 오류가 발생했습니다.")
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(NexonApiRateLimitException.class)
    public ResponseEntity<ErrorResponse> handleNexonApiRateLimit(NexonApiRateLimitException ex) {
        log.warn("Nexon API Rate Limit 초과: {}, 재시도 가능 시간: {}초 후", ex.getMessage(), ex.getRetryAfterSeconds());
        String message = String.format("요청이 너무 많습니다. %d초 후 다시 시도해 주세요.", ex.getRetryAfterSeconds());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(ex.getRetryAfterSeconds()))
                .body(ErrorResponse.builder()
                        .status(HttpStatus.TOO_MANY_REQUESTS.value())
                        .message(message)
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<ErrorResponse> handleResourceAccess(ResourceAccessException ex) {
        log.error("외부 API 연결 오류", ex);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ErrorResponse.builder()
                        .status(HttpStatus.SERVICE_UNAVAILABLE.value())
                        .message("외부 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.")
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("서버 오류 발생", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.builder()
                        .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                        .message("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @lombok.Builder
    @lombok.Getter
    public static class ErrorResponse {
        private int status;
        private String message;
        private Map<String, String> errors;
        private LocalDateTime timestamp;
    }
}
