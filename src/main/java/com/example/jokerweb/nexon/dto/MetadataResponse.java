package com.example.jokerweb.nexon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import java.util.Map;

@Getter
@Setter
public class MetadataResponse {
    // 메타데이터 응답은 동적 구조일 수 있으므로 Map으로 받음
    private Map<String, Object> data;
    
    // 또는 특정 필드가 있다면 추가
    @JsonProperty("grade")
    private Map<String, Object> grade;
    
    @JsonProperty("season_grade")
    private Map<String, Object> seasonGrade;
    
    @JsonProperty("tier")
    private Map<String, Object> tier;
    
    @JsonProperty("logo")
    private Map<String, Object> logo;
}
