package com.example.jokerweb.nexon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRankResponse {
    @JsonProperty("user_name")
    private String userName;
    private String grade;
    @JsonProperty("grade_exp")
    private Long gradeExp;
    @JsonProperty("grade_ranking")
    private Long gradeRanking;
    @JsonProperty("season_grade")
    private String seasonGrade;
    @JsonProperty("season_grade_exp")
    private Long seasonGradeExp;
    @JsonProperty("season_grade_ranking")
    private Long seasonGradeRanking;
    // 계급 이미지 URL (API 응답에 포함될 수 있음)
    @JsonProperty("grade_image")
    private String gradeImage;
    @JsonProperty("season_grade_image")
    private String seasonGradeImage;
}

