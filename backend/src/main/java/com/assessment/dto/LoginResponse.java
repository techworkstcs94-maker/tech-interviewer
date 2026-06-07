package com.assessment.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String sessionId;
    private String token;
    private String candidateName;
}
