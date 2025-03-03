package com.woniu.www.qa.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;

@Service
public class DeepSeekService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${openai.timeout.connect:60}")
    private long timeout;

    public DeepSeekService(WebClient webClient, ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.objectMapper = objectMapper;
    }

    public Mono<JsonNode> sendMessage(String prompt) {
        ObjectNode requestBody = objectMapper.createObjectNode()
                .put("model", "deepseek-chat")
                .put("max_tokens", 500)
                .put("temperature", 0.7);

        requestBody.putArray("messages")
                .addObject()
                .put("role", "user")
                .put("content", prompt);

        return webClient.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(timeout))
                .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(2)))
                .onErrorResume(e -> Mono.error(new RuntimeException("Failed to connect to DeepSeek API: " + e.getMessage())));
    }
}