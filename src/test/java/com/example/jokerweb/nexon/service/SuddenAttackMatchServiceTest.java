package com.example.jokerweb.nexon.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.example.jokerweb.match.MatchSummaryRepository;
import com.example.jokerweb.nexon.NxOpenApiClient;
import com.example.jokerweb.nexon.dto.MatchListResponse;
import com.example.jokerweb.nexon.dto.MatchResult;
import com.example.jokerweb.nexon.dto.MatchSummaryResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("SuddenAttackMatchService 테스트")
class SuddenAttackMatchServiceTest {

    @Mock
    private NxOpenApiClient nxOpenApiClient;

    @Mock
    private MatchSummaryRepository matchSummaryRepository;

    @InjectMocks
    private SuddenAttackMatchService matchService;

    private String testOuid;
    private String testMatchMode;
    private String testMatchType;

    @BeforeEach
    void setUp() {
        testOuid = "4c0a1cc8ecc1925a6b60bbd19c5c40ce";
        testMatchMode = "폭파미션";
        testMatchType = "랭크전 솔로";
    }

    @Test
    @DisplayName("URL 인코딩 테스트 - 한글 파라미터 처리")
    void testUrlEncoding_KoreanParameters() {
        // given
        MatchListResponse mockResponse = createMockResponse();
        when(nxOpenApiClient.getMatches(eq(testOuid), eq(testMatchMode), eq(testMatchType)))
                .thenReturn(mockResponse);
        when(matchSummaryRepository.findById(anyString())).thenReturn(java.util.Optional.empty());

        // when
        MatchSummaryResponse response = matchService.getMatches(
                testOuid, testMatchMode, testMatchType, null, null, false);

        // then
        assertNotNull(response);
        assertEquals(1, response.getMatches().size());
        verify(nxOpenApiClient).getMatches(eq(testOuid), eq(testMatchMode), eq(testMatchType));
    }

    @Test
    @DisplayName("match_result 매핑 테스트 - WIN")
    void testMatchResultMapping_Win() {
        // given
        MatchListResponse mockResponse = createMockResponseWithResult("1");
        when(nxOpenApiClient.getMatches(anyString(), anyString(), anyString()))
                .thenReturn(mockResponse);
        when(matchSummaryRepository.findById(anyString())).thenReturn(java.util.Optional.empty());

        // when
        MatchSummaryResponse response = matchService.getMatches(
                testOuid, testMatchMode, testMatchType, null, null, false);

        // then
        assertNotNull(response);
        assertEquals(1, response.getMatches().size());
        assertEquals(MatchResult.WIN, response.getMatches().get(0).getMatchResult());
    }

    @Test
    @DisplayName("match_result 매핑 테스트 - LOSE")
    void testMatchResultMapping_Lose() {
        // given
        MatchListResponse mockResponse = createMockResponseWithResult("2");
        when(nxOpenApiClient.getMatches(anyString(), anyString(), anyString()))
                .thenReturn(mockResponse);
        when(matchSummaryRepository.findById(anyString())).thenReturn(java.util.Optional.empty());

        // when
        MatchSummaryResponse response = matchService.getMatches(
                testOuid, testMatchMode, testMatchType, null, null, false);

        // then
        assertNotNull(response);
        assertEquals(1, response.getMatches().size());
        assertEquals(MatchResult.LOSE, response.getMatches().get(0).getMatchResult());
    }

    @Test
    @DisplayName("match_result 매핑 테스트 - UNKNOWN")
    void testMatchResultMapping_Unknown() {
        // given
        MatchListResponse mockResponse = createMockResponseWithResult(null);
        when(nxOpenApiClient.getMatches(anyString(), anyString(), anyString()))
                .thenReturn(mockResponse);
        when(matchSummaryRepository.findById(anyString())).thenReturn(java.util.Optional.empty());

        // when
        MatchSummaryResponse response = matchService.getMatches(
                testOuid, testMatchMode, testMatchType, null, null, false);

        // then
        assertNotNull(response);
        assertEquals(1, response.getMatches().size());
        assertEquals(MatchResult.UNKNOWN, response.getMatches().get(0).getMatchResult());
    }

    @Test
    @DisplayName("잘못된 match_mode 파라미터 검증")
    void testInvalidMatchMode_ThrowsException() {
        // when & then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            matchService.getMatches(testOuid, "잘못된모드", testMatchType, null, null, false);
        });

        assertTrue(exception.getMessage().contains("유효하지 않은 match_mode"));
    }

    @Test
    @DisplayName("잘못된 match_type 파라미터 검증")
    void testInvalidMatchType_ThrowsException() {
        // when & then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            matchService.getMatches(testOuid, testMatchMode, "잘못된타입", null, null, false);
        });

        assertTrue(exception.getMessage().contains("유효하지 않은 match_type"));
    }

    @Test
    @DisplayName("빈 ouid 파라미터 검증")
    void testEmptyOuid_ThrowsException() {
        // when & then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            matchService.getMatches("", testMatchMode, testMatchType, null, null, false);
        });

        assertTrue(exception.getMessage().contains("ouid는 필수"));
    }

    @Test
    @DisplayName("limit 파라미터 적용 테스트")
    void testLimitParameter() {
        // given
        MatchListResponse mockResponse = createMockResponseWithMultipleMatches(5);
        when(nxOpenApiClient.getMatches(anyString(), anyString(), anyString()))
                .thenReturn(mockResponse);
        when(matchSummaryRepository.findById(anyString())).thenReturn(java.util.Optional.empty());

        // when
        MatchSummaryResponse response = matchService.getMatches(
                testOuid, testMatchMode, testMatchType, null, 3, false);

        // then
        assertNotNull(response);
        assertEquals(3, response.getMatches().size());
        assertTrue(response.getHasMore());
    }

    // Helper methods
    private MatchListResponse createMockResponse() {
        MatchListResponse response = new MatchListResponse();
        List<MatchListResponse.MatchItem> matches = new ArrayList<>();
        
        MatchListResponse.MatchItem item = new MatchListResponse.MatchItem();
        item.setMatchId("1234567890123456789012345678901234567890"); // 긴 문자열로 테스트
        item.setMatchType(testMatchType);
        item.setMatchMode(testMatchMode);
        item.setDateMatch(OffsetDateTime.now(ZoneOffset.UTC));
        item.setMatchResult("1");
        item.setKill(10);
        item.setDeath(5);
        item.setAssist(3);
        matches.add(item);
        
        response.setMatch(matches);
        return response;
    }

    private MatchListResponse createMockResponseWithResult(String matchResult) {
        MatchListResponse response = createMockResponse();
        response.getMatch().get(0).setMatchResult(matchResult);
        return response;
    }

    private MatchListResponse createMockResponseWithMultipleMatches(int count) {
        MatchListResponse response = new MatchListResponse();
        List<MatchListResponse.MatchItem> matches = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            MatchListResponse.MatchItem item = new MatchListResponse.MatchItem();
            item.setMatchId("match_" + i);
            item.setMatchType(testMatchType);
            item.setMatchMode(testMatchMode);
            item.setDateMatch(OffsetDateTime.now(ZoneOffset.UTC));
            item.setMatchResult("1");
            item.setKill(10);
            item.setDeath(5);
            item.setAssist(3);
            matches.add(item);
        }
        
        response.setMatch(matches);
        return response;
    }
}
