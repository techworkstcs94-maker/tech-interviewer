package com.solutions.challenge4;

import java.util.List;

class ErrorResponse {
    private String timestamp;
    private int status;
    private String message;
    private String path;
    private List<String> errors;

    ErrorResponse(String timestamp, int status, String message, String path, List<String> errors) {
        this.timestamp = timestamp; this.status = status; this.message = message;
        this.path = path; this.errors = errors;
    }

    public String getTimestamp() { return timestamp; }
    public int getStatus() { return status; }
    public String getMessage() { return message; }
    public String getPath() { return path; }
    public List<String> getErrors() { return errors; }
}
