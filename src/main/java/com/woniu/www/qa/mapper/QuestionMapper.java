package com.woniu.www.qa.mapper;

import com.woniu.www.qa.entity.Question;
import org.apache.ibatis.annotations.*;

import java.util.List;

public interface QuestionMapper {

    @Insert("INSERT INTO questions(title, answer) VALUES(#{title}, #{answer})")
    void insert(Question question);

    @Delete("DELETE FROM questions WHERE id = #{id}")
    void deleteById(Integer id);

    @Update("UPDATE questions SET title = #{title}, answer = #{answer} WHERE id = #{id}")
    void update(Question question);

    @Select("SELECT * FROM questions WHERE id = #{id}")
    Question findById(Integer id);

    @Select("SELECT * FROM questions WHERE title LIKE CONCAT('%', #{keyword}, '%') ORDER BY id DESC")
    List<Question> findByTitleKeyword(String keyword);

    @Select("SELECT COUNT(*) FROM questions WHERE title LIKE CONCAT('%', #{keyword}, '%')")
    long countByTitleKeyword(String keyword);
}