package com.example.jokerweb.nexon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TierMetadataItem {
    @JsonProperty("tier")
    private String tier;
    
    @JsonProperty("tier_image")
    private String tierImage;
}
