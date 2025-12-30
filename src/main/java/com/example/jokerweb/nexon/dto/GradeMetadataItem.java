package com.example.jokerweb.nexon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GradeMetadataItem {
    @JsonProperty("grade")
    private String grade;
    
    @JsonProperty("grade_image")
    private String gradeImage;
}
