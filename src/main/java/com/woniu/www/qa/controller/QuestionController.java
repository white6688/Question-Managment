package com.woniu.www.qa.controller;

import com.github.pagehelper.PageInfo;
import com.woniu.www.qa.entity.Question;
import com.woniu.www.qa.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/questions")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    @PostMapping
    public String addQuestion(@RequestBody Question question) {
        if (question.getTitle() == null || question.getTitle().isEmpty()) {
            return "Title cannot be null or empty";
        }
        questionService.addQuestion(question);
        return "Question added successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteQuestion(@PathVariable Integer id) {
        questionService.deleteQuestion(id);
        return "Question deleted successfully";
    }

    @PutMapping
    public String updateQuestion(@RequestBody Question question) {
        if (question.getTitle() == null || question.getTitle().isEmpty()) {
            return "Title cannot be null or empty";
        }
        questionService.updateQuestion(question);
        return "Question updated successfully";
    }

    @GetMapping("/{id}")
    public Question getQuestionById(@PathVariable Integer id) {
        return questionService.getQuestionById(id);
    }

@GetMapping
public Map<String, Object> getQuestionsByTitleKeyword(
        @RequestParam String keyword,
        @RequestParam(defaultValue = "1") int pageNum,
        @RequestParam(defaultValue = "10") int pageSize
) {
    PageInfo<Question> pageInfo = questionService.getQuestionsByTitleKeyword(keyword, pageNum, pageSize);
    Map<String, Object> response = new HashMap<>();
    response.put("list", pageInfo.getList());
    response.put("total", pageInfo.getTotal());
    response.put("pageNum", pageInfo.getPageNum());
    response.put("pageSize", pageInfo.getPageSize());
    response.put("totalPages", pageInfo.getPages());
    return response;
}

    @PostMapping("/upload")
    public Map<String, String> uploadQuestionsFile(@RequestParam("file") MultipartFile file) {
        Map<String, String> response = new HashMap<>();
        try {
            questionService.processQuestionsFile(file);
            response.put("status", "success");
            response.put("message", "文件上传并处理成功");
        } catch (IllegalArgumentException e) {
            response.put("status", "error");
            response.put("message", "文件格式错误: " + e.getMessage());
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "处理文件时发生错误: " + e.getMessage());
            e.printStackTrace(); // 在生产环境中应该使用proper logging
        }
        return response;
    }

    @PostMapping("/ai-answer")
    public Map<String, String> generateAIAnswer(@RequestBody Map<String, String> request) {
        String title = request.get("title");
        String answer = questionService.generateAIAnswer(title);
        Map<String, String> response = new HashMap<>();
        response.put("answer", answer);
        return response;
    }
}