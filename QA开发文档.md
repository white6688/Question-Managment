# QA开发文档

## 1.0 完成基础增删查改

## 1.1 增加文件上传

​		csv两列，title+answer

## 1.2 增加AI回答

​		由于找不到deepseek的maven依赖库，只能使用openai的框架，调试gpt-3.5

## 1.3 接入deepseek

​		修改了config和servicce

## 1.4 三栏式布局样式调整

## 1.5 调整分页布局

​		折叠按钮放左上角；左侧模块Add Question、Upload Questions做成可折叠；Previous、Next默认不显示，搜索后显示；Back to Top、Scroll to Bottom换成上下箭头；搜索结果的title和answer之间要多一个空行；Page 1增加总页数，如page 1 of 10；增加页码导航，输入数字提交后可跳转页面

## 1.6 重构搜索模块

​		增加左侧边栏的宽度30px；页码信息要在底部显示；搜索模块，只要搜索框和搜索按钮，放在页面中间，不放在左边；搜索结果在搜索框下面展示，每个结果默认展开，都要可折叠，折叠后只显示id和标题

## 1.7 支持md格式显示

​		换行、tab支持

## 1.8 安全漏洞防护

项目中的安全防护措施主要分布在以下几个地方：

1. `SecurityUtils.java` 中的输入安全过滤：
```java
public static String sanitizeInput(String input) {
    if (input == null) {
        return null;
    }
    // 转义 HTML 和 JavaScript 代码，防止 XSS 攻击
    return StringEscapeUtils.escapeHtml4(
        StringEscapeUtils.escapeEcmaScript(processedInput))
        .replace("\\n", "\n")
        .replace("\\t", "    ");
}
```
效果：防止 XSS 攻击，转义特殊字符

2. 文件上传验证 (`SecurityUtils.java`)：
```java
public static boolean isValidFile(MultipartFile file) {
    return file != null
        && !file.isEmpty()
        && file.getSize() <= MAX_FILE_SIZE
        && ALLOWED_FILE_TYPES.contains(file.getContentType())
        && file.getOriginalFilename().toLowerCase().endsWith(".csv");
}
```
效果：
- 防止空文件上传
- 限制文件大小
- 限制文件类型
- 验证文件扩展名

3. `QuestionController.java` 中的输入验证：
```java
@PostMapping
public String addQuestion(@RequestBody @Valid Question question) {
    if (question.getTitle() == null || question.getTitle().isEmpty()) {
        return "Title cannot be null or empty";
    }
    questionService.addQuestion(question);
    return "Question added successfully";
}
```
效果：防止空值和非法输入

4. MyBatis Mapper 中的参数处理：
```java
@Select("SELECT * FROM questions WHERE title LIKE CONCAT('%', #{keyword}, '%')")
```
- `#{}`：用于预编译参数，能够防止 SQL 注入。



5. `application.properties` 中的文件上传配置：
```properties
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```
效果：全局控制文件上传大小









后续可能增加：
登录、用户增删查改、头像上传