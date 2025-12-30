package com.example.jokerweb.community.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BoardRuleResponse {
    private String category;
    private String name;
    private String description;
    private boolean canRead;
    private boolean canWrite;
    private int minTitleLength;
    private int maxTitleLength;
    private int minContentLength;
    private int maxContentLength;
    private int maxMediaCount;
    private boolean allowAnonymous;
    private boolean allowLinks;
    private boolean allowYoutube;
    private boolean allowTable;
    private boolean allowCodeBlock;
    private String notice;
}
