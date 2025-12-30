package com.example.jokerweb.match;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MatchPlayerRepository extends JpaRepository<MatchPlayer, MatchPlayerId> {
    List<MatchPlayer> findByOuidOrderByMatchIdDesc(String ouid);
    
    List<MatchPlayer> findByMatchId(String matchId);

    /**
     * N+1 쿼리 문제 해결을 위한 fetch join 쿼리
     */
    @Query("SELECT mp FROM MatchPlayer mp " +
           "JOIN FETCH mp.matchMeta " +
           "JOIN FETCH mp.player " +
           "WHERE mp.ouid = :ouid " +
           "ORDER BY mp.matchId DESC")
    List<MatchPlayer> findByOuidWithDetails(String ouid);

    interface MapStatsView {
        String getMatchMap();
        Long getGames();
        Long getWins();
        Double getWinRate();
        Double getKd();
        Double getHsr();
    }

    interface TimeBucketView {
        Integer getHourKst();
        Long getGames();
        Long getWins();
        Double getWinRate();
        Double getKd();
        Double getDamage();
    }

    interface RankedStatsView {
        String getMatchType();
        Long getGames();
        Long getWins();
        Double getWinRate();
        Double getKd();
        Double getKda();
        Double getDamage();
    }

    interface GlobalMapStatsView {
        String getMatchMap();
        Long getGames();
        Long getWins();
        Double getWinRate();
        Double getKd();
        Double getHsr();
    }

    interface GlobalTimeBucketView {
        Integer getHourKst();
        Long getGames();
        Long getWins();
        Double getWinRate();
        Double getKd();
    }

    @Query(value = """
            SELECT m.match_map AS matchMap,
                   COUNT(*) AS games,
                   SUM(CASE WHEN mp.match_result='1' THEN 1 ELSE 0 END) AS wins,
                   ROUND(SUM(CASE WHEN mp.match_result='1' THEN 1 ELSE 0 END)/COUNT(*),3) AS winRate,
                   ROUND(SUM(mp.kill_count)/NULLIF(SUM(mp.death_count),0),3) AS kd,
                   ROUND(SUM(mp.headshot)/NULLIF(SUM(mp.kill_count),0),3) AS hsr
            FROM match_player mp
            JOIN match_meta m ON mp.match_id = m.match_id
            WHERE mp.ouid = :ouid
            GROUP BY m.match_map
            """, nativeQuery = true)
    List<MapStatsView> findMapStats(String ouid);

    @Query(value = """
            SELECT HOUR(CONVERT_TZ(m.date_match_utc, '+00:00', '+09:00')) AS hourKst,
                   COUNT(*) AS games,
                   SUM(CASE WHEN mp.match_result='1' THEN 1 ELSE 0 END) AS wins,
                   ROUND(SUM(CASE WHEN mp.match_result='1' THEN 1 ELSE 0 END)/COUNT(*),3) AS winRate,
                   ROUND(SUM(mp.kill_count)/NULLIF(SUM(mp.death_count),0),3) AS kd,
                   ROUND(AVG(mp.damage),2) AS damage
            FROM match_player mp
            JOIN match_meta m ON mp.match_id = m.match_id
            WHERE mp.ouid = :ouid
            GROUP BY hourKst
            """, nativeQuery = true)
    List<TimeBucketView> findTimeBucketStats(String ouid);

    @Query(value = """
            SELECT m.match_type AS matchType,
                   COUNT(*) AS games,
                   SUM(CASE WHEN mp.match_result='1' THEN 1 ELSE 0 END) AS wins,
                   ROUND(SUM(CASE WHEN mp.match_result='1' THEN 1 ELSE 0 END)/COUNT(*),3) AS winRate,
                   ROUND(SUM(mp.kill_count)/NULLIF(SUM(mp.death_count),0),3) AS kd,
                   ROUND((SUM(mp.kill_count) + SUM(mp.assist_count))/NULLIF(SUM(mp.death_count),0),3) AS kda,
                   ROUND(AVG(mp.damage),2) AS damage
            FROM match_player mp
            JOIN match_meta m ON mp.match_id = m.match_id
            WHERE mp.ouid = :ouid 
              AND m.match_type IN ('랭크전 솔로', '랭크전 파티', '클랜전')
            GROUP BY m.match_type
            """, nativeQuery = true)
    List<RankedStatsView> findRankedStats(String ouid);

    @Query(value = """
            SELECT m.match_map AS matchMap,
                   COUNT(*) AS games,
                   SUM(CASE WHEN mp.match_result='1' THEN 1 ELSE 0 END) AS wins,
                   ROUND(SUM(CASE WHEN mp.match_result='1' THEN 1 ELSE 0 END)/COUNT(*),3) AS winRate,
                   ROUND(SUM(mp.kill_count)/NULLIF(SUM(mp.death_count),0),3) AS kd,
                   ROUND(SUM(mp.headshot)/NULLIF(SUM(mp.kill_count),0),3) AS hsr
            FROM match_player mp
            JOIN match_meta m ON mp.match_id = m.match_id
            GROUP BY m.match_map
            """, nativeQuery = true)
    List<GlobalMapStatsView> findGlobalMapStats();

    @Query(value = """
            SELECT HOUR(CONVERT_TZ(m.date_match_utc, '+00:00', '+09:00')) AS hourKst,
                   COUNT(*) AS games,
                   SUM(CASE WHEN mp.match_result='1' THEN 1 ELSE 0 END) AS wins,
                   ROUND(SUM(CASE WHEN mp.match_result='1' THEN 1 ELSE 0 END)/COUNT(*),3) AS winRate,
                   ROUND(SUM(mp.kill_count)/NULLIF(SUM(mp.death_count),0),3) AS kd
            FROM match_player mp
            JOIN match_meta m ON mp.match_id = m.match_id
            GROUP BY hourKst
            """, nativeQuery = true)
    List<GlobalTimeBucketView> findGlobalTimeBucketStats();
}

