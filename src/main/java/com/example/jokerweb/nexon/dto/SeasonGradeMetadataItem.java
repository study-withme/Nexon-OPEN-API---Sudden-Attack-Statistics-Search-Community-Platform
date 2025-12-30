package com.example.jokerweb.nexon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SeasonGradeMetadataItem {
    @JsonProperty("season_grade")
    private String seasonGrade;
    
    @JsonProperty("season_grade_image")
    private String seasonGradeImage;
}
