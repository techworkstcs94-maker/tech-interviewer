package com.assessment.dto;

import lombok.Data;

/** Candidate login = using a recruiter-issued assessment link; name/email come from the invite. */
@Data
public class LoginRequest {
    private String inviteToken;
}
