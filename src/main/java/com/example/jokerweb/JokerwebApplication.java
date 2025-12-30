package com.example.jokerweb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {RedisRepositoriesAutoConfiguration.class})
@EnableJpaRepositories(basePackages = "com.example.jokerweb")
@EnableCaching
@EnableScheduling
@EnableAsync
public class JokerwebApplication {

	public static void main(String[] args) {
		SpringApplication.run(JokerwebApplication.class, args);
	}

}
