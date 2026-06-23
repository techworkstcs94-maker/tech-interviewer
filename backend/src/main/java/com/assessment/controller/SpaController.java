package com.assessment.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Forwards all React Router paths to index.html so direct URL access and
 * browser refresh work correctly for SPA routes like /recruiter, /challenge, etc.
 */
@Controller
public class SpaController {

    // Root
    @GetMapping("/")
    public String root() {
        return "forward:/index.html";
    }

    // Single-segment paths that have no dot (excludes .js / .css / .ico etc.)
    @GetMapping("/{path:[^\\.]*}")
    public String spaRoot(@PathVariable String path) {
        return "forward:/index.html";
    }

    // Two-segment paths, e.g. /recruiter/dashboard
    @GetMapping("/{seg1:[^\\.]*}/{seg2:[^\\.]*}")
    public String spaNested(@PathVariable String seg1, @PathVariable String seg2) {
        return "forward:/index.html";
    }

    // Three-segment paths, e.g. /recruiter/session/{sessionId}
    @GetMapping("/{seg1:[^\\.]*}/{seg2:[^\\.]*}/{seg3:[^\\.]*}")
    public String spaDeep(
            @PathVariable String seg1,
            @PathVariable String seg2,
            @PathVariable String seg3) {
        return "forward:/index.html";
    }
}
