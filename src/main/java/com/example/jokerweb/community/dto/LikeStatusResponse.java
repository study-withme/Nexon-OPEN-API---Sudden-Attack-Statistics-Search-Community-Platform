package com.example.jokerweb.community.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LikeStatusResponse {
    private boolean liked;
    private boolean disliked;
}

