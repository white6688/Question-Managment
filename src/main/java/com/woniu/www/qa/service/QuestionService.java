package com.woniu.www.qa.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.theokanning.openai.completion.CompletionRequest;
import com.woniu.www.qa.config.DeepSeekService;
import com.woniu.www.qa.entity.Question;
import com.woniu.www.qa.mapper.QuestionMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;

import com.theokanning.openai.service.OpenAiService;
import com.theokanning.openai.completion.CompletionRequest;
import com.theokanning.openai.completion.CompletionResult;
import com.theokanning.openai.service.OpenAiService;

import static jdk.nashorn.internal.runtime.regexp.joni.Config.log;


@Service
public class QuestionService {


    @Autowired
    private OpenAiService openAiService;

    @Autowired
    private QuestionMapper questionMapper;

    @Autowired
    private DeepSeekService deepSeekService;


    public void addQuestion(Question question) {
        questionMapper.insert(question);
    }

    public void deleteQuestion(Integer id) {
        questionMapper.deleteById(id);
    }

    public void updateQuestion(Question question) {
        questionMapper.update(question);
    }

    public Question getQuestionById(Integer id) {
        return questionMapper.findById(id);
    }

public PageInfo<Question> getQuestionsByTitleKeyword(String keyword, int pageNum, int pageSize) {
    // Configure PageHelper with reasonable defaults
    pageNum = Math.max(1, pageNum);
    pageSize = Math.max(1, Math.min(pageSize, 100));

    // Start PageHelper
    PageHelper.startPage(pageNum, pageSize);

    try {
        // Execute query
        List<Question> questions = questionMapper.findByTitleKeyword(keyword);

        // Create PageInfo with total count
        PageInfo<Question> pageInfo = new PageInfo<>(questions);

        // Set reasonable defaults if no results
        if (pageInfo.getList().isEmpty() && pageNum > 1) {
            PageHelper.startPage(1, pageSize);
            questions = questionMapper.findByTitleKeyword(keyword);
            pageInfo = new PageInfo<>(questions);
        }

        return pageInfo;
    } catch (Exception e) {
        // Log error and return empty page
        return new PageInfo<>(new ArrayList<>());
    }
}


    public void processQuestionsFile(MultipartFile file) throws Exception {
        Path tempFile = Files.createTempFile("questions", ".csv");
        Files.write(tempFile, file.getBytes());

        try (BufferedReader br = new BufferedReader(new InputStreamReader(Files.newInputStream(tempFile)))) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length == 2) {
                    String title = parts[0].trim();
                    String answer = parts[1].trim();
                    Question question = new Question();
                    question.setTitle(title);
                    question.setAnswer(answer);
                    questionMapper.insert(question);
                }
            }
        } finally {
            Files.delete(tempFile); // Delete the temporary file
        }
    }


    public String generateAIAnswer(String title) {
        try {
            JsonNode response = deepSeekService.sendMessage(title)
                    .block(Duration.ofSeconds(120)); // Add timeout for blocking call

            if (response != null && response.has("choices") &&
                    !response.get("choices").isEmpty()) {
                return response.get("choices").get(0)
                        .get("message").get("content").asText();
            }
            return "No answer generated";
        } catch (Exception e) {
            return "Failed to generate AI answer: " + e.getMessage();
        }
    }
}
