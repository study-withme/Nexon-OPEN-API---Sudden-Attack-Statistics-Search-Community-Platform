package com.example.jokerweb.stats;

import com.example.jokerweb.community.BarracksReportRepository;
import com.example.jokerweb.logging.AccessLogRepository;
import com.example.jokerweb.member.MemberRepository;
import com.example.jokerweb.stats.dto.PublicStatsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublicStatsService {

    private final MemberRepository memberRepository;
    private final AccessLogRepository accessLogRepository;
    private final BarracksReportRepository barracksReportRepository;

    public PublicStatsResponse getPublicStats() {
        try {
            // 오늘의 시작과 끝 시간
            LocalDate today = LocalDate.now();
            LocalDateTime todayStart = today.atStartOfDay();
            LocalDateTime todayEnd = today.atTime(LocalTime.MAX);

            // 오늘 가입자 수
            long todaySignups = 0;
            try {
                todaySignups = memberRepository.countByCreatedAtBetween(todayStart, todayEnd);
            } catch (Exception e) {
                log.warn("오늘 가입자 수 조회 실패: {}", e.getMessage());
            }

            // 오늘 방문수 (occurredAt 기준)
            long todayVisits = 0;
            try {
                todayVisits = accessLogRepository.countByOccurredAtBetween(todayStart, todayEnd);
            } catch (Exception e) {
                log.warn("오늘 방문수 조회 실패: {}", e.getMessage());
            }

            // 총 방문수 (누적)
            long totalVisits = 0;
            try {
                totalVisits = accessLogRepository.count();
            } catch (Exception e) {
                log.warn("총 방문수 조회 실패: {}", e.getMessage());
            }

            // 이상탐지 수 (reportType = 'troll'이고 삭제되지 않은 것들)
            long trollReports = 0;
            try {
                trollReports = barracksReportRepository.countTrollReports();
            } catch (Exception e) {
                log.warn("이상탐지 수 조회 실패: {}", e.getMessage());
            }

            return PublicStatsResponse.builder()
                    .todaySignups(todaySignups)
                    .todayVisits(todayVisits)
                    .totalVisits(totalVisits)
                    .trollReports(trollReports)
                    .build();
        } catch (Exception e) {
            log.error("공개 통계 조회 중 오류 발생", e);
            // 예외 발생 시 기본값 반환
            return PublicStatsResponse.builder()
                    .todaySignups(0)
                    .todayVisits(0)
                    .totalVisits(0)
                    .trollReports(0)
                    .build();
        }
    }
}
