package com.woniu.www.qa.config;

    import com.fasterxml.jackson.annotation.JsonInclude;
    import com.fasterxml.jackson.databind.DeserializationFeature;
    import com.fasterxml.jackson.databind.ObjectMapper;
    import com.fasterxml.jackson.databind.PropertyNamingStrategy;
    import com.theokanning.openai.service.OpenAiService;
    import io.netty.channel.ChannelOption;
    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Configuration;

    import io.netty.handler.timeout.ReadTimeoutHandler;
    import io.netty.handler.timeout.WriteTimeoutHandler;
    import org.springframework.http.client.reactive.ReactorClientHttpConnector;
    import org.springframework.web.reactive.function.client.WebClient;
    import reactor.netty.http.client.HttpClient;

    import java.time.Duration;
    import java.util.concurrent.TimeUnit;

    @Configuration
    public class OpenAiConfig {

        @Value("${openai.api.key}")
        private String apiKey;

        @Value("${openai.timeout.connect:60}")
        private long timeout;

        @Value("${openai.api.url}")
        private String apiUrl;

        @Bean
        public OpenAiService openAiService() {
            return new OpenAiService(apiKey, Duration.ofSeconds(timeout));
        }

        @Bean
        public WebClient webClient() {
            HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, (int) Duration.ofSeconds(timeout).toMillis())
                .doOnConnected(conn -> conn
                    .addHandlerLast(new ReadTimeoutHandler(timeout, TimeUnit.SECONDS))
                    .addHandlerLast(new WriteTimeoutHandler(timeout, TimeUnit.SECONDS)));

            return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .baseUrl(apiUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        }

        @Bean
        public ObjectMapper objectMapper() {
            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
            mapper.setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE);
            return mapper;
        }
    }