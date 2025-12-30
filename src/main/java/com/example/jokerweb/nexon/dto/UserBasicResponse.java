package com.example.jokerweb.nexon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserBasicResponse {
    @JsonProperty("user_name")
    private String userName;
    @JsonProperty("user_date_create")
    private OffsetDateTime userDateCreate;
    @JsonProperty("title_name")
    private String titleName;
    @JsonProperty("clan_name")
    private String clanName;
    @JsonProperty("manner_grade")
    private String mannerGrade;
}

