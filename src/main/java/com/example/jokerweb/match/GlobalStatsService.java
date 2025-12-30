package com.example.jokerweb.match;

import com.example.jokerweb.player.InsightResponses;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GlobalStatsService {

    private final MatchPlayerRepository matchPlayerRepository;

    @Cacheable(cacheNames = "globalMapStats")
    public List<InsightResponses.MapStat> getGlobalMapStats() {
        return matchPlayerRepository.findGlobalMapStats().stream()
                .map(v -> InsightResponses.MapStat.builder()
                        .matchMap(v.getMatchMap())
                        .games(v.getGames())
                        .wins(v.getWins())
                        .winRate(v.getWinRate())
                        .kd(v.getKd())
                        .hsr(v.getHsr())
                        .build())
                .collect(Collectors.toList());
    }

    @Cacheable(cacheNames = "globalTimeStats")
    public List<InsightResponses.TimeBucketStat> getGlobalTimeStats() {
        return matchPlayerRepository.findGlobalTimeBucketStats().stream()
                .map(v -> InsightResponses.TimeBucketStat.builder()
                        .hourKst(v.getHourKst())
                        .games(v.getGames())
                        .wins(v.getWins())
                        .winRate(v.getWinRate())
                        .kd(v.getKd())
                        .build())
                .collect(Collectors.toList());
    }
}
