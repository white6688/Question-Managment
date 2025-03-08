document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const questionForm = document.getElementById('questionForm');
    const searchForm = document.getElementById('searchForm');
    const questionList = document.getElementById('questionList');
    const updateModal = document.getElementById('updateModal');
    const updateForm = document.getElementById('updateForm');
    const pageInfo = document.getElementById('pageInfo');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    window.currentPage = 1;
    window.totalPages = 1;

    // Initialize sidebar state
    if (window.innerWidth > 768) {
        sidebar.classList.remove('collapsed');
    }

    // Auto-resize all textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', autoResize);
    });

    function autoResize() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    }

    // AI Answer Button
    const aiAnswerButton = document.getElementById('aiAnswerButton');
    aiAnswerButton.addEventListener('click', async () => {
        const title = document.getElementById('addTitle').value;
        if (!title) {
            alert('Please enter a title first.');
            return;
        }

        try {
            const response = await fetch('/questions/ai-answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title })
            });

            const data = await response.json();
            const answerTextarea = document.getElementById('addAnswer');
            answerTextarea.value = data.answer;

            // Auto-resize the textarea
            answerTextarea.style.height = 'auto';
            answerTextarea.style.height = answerTextarea.scrollHeight + 'px';
        } catch (error) {
            alert('Error generating AI answer: ' + error.message);
        }
    });

    // File Upload
    const fileUploadForm = document.getElementById('fileUploadForm');
    fileUploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const fileInput = document.getElementById('questionsFile');
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            const response = await fetch('/questions/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            alert(result.message);
            
            if (result.status === 'success') {
                fileInput.value = ''; // 清空文件输入
                document.getElementById('file-name').textContent = 'No file chosen';
                searchForm.dispatchEvent(new Event('submit')); // 刷新列表
            }
        } catch (error) {
            alert('上传文件时发生错误: ' + error.message);
        }
    });

    // Add Question
    questionForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const title = event.target.addTitle.value;
        const answer = event.target.addAnswer.value;

        try {
            const response = await fetch('/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title.trim(),
                    answer: answer.trim()
                })
            });

            const result = await response.text();
            alert(result);
            closeAddModal(); // Close the modal after submission
            searchForm.dispatchEvent(new Event('submit')); // Refresh the list
        } catch (error) {
            alert('Error adding question: ' + error.message);
        }
    });

    // Search Questions
    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const keyword = event.target.searchKeyword.value;
        window.currentPage = 1; // Reset to first page
        await window.fetchQuestions(keyword, window.currentPage);
    });

    // Update Question
    updateForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = document.getElementById('updateId').value;
        const title = document.getElementById('updateTitle').value;
        const answer = document.getElementById('updateAnswer').value;

        try {
            const response = await fetch('/questions', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, title, answer })
            });

            const result = await response.text();
            alert(result);
            closeUpdateModal();
            searchForm.dispatchEvent(new Event('submit')); // Refresh the list
        } catch (error) {
            alert('Error updating question: ' + error.message);
        }
    });

    // File upload display filename
    const fileInput = document.getElementById('questionsFile');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const fileName = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
            const fileNameDisplay = document.getElementById('file-name');
            if (fileNameDisplay) {
                fileNameDisplay.textContent = fileName;
            }
        });
    }

    // Responsive sidebar handling
    window.addEventListener('resize', () => {
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            document.body.classList.remove('no-scroll');
        } else {
            sidebar.classList.add('collapsed');
        }
    });

    // Initialize by fetching the first page with empty search
    window.fetchQuestions('', 1);
});



function escapeHtml(str) {
    if (typeof str !== 'string') {
        return '';
    }

    // 使用正则表达式一次性替换所有特殊字符
    const replaceMap = [
        [/&/g, '&amp;'],         // 转义 &
        [/</g, '&lt;'],          // 转义 <
        [/>/g, '&gt;'],          // 转义 >
        [/"/g, '&quot;'],        // 转义双引号
        [/'/g, '&#039;'],        // 转义单引号
        [/`/g, '&#96;']          // 转义反引号
    ];

    return replaceMap.reduce((acc,  [regex, replacement]) => {
        return acc.replace(regex,  replacement);
    }, str);
}


// Attach fetchQuestions to window to make it globally accessible
window.fetchQuestions = async function(keyword, page) {
    try {
        const response = await fetch(`/questions?keyword=${encodeURIComponent(keyword)}&pageNum=${page}&pageSize=10`);
        const data = await response.json();

        const questionList = document.getElementById('questionList');
        questionList.innerHTML = '';
        const template = document.getElementById('questionTemplate').innerHTML;

        data.list.forEach(question => {
            const escapedTitle = escapeHtml(question.title);
            const escapedAnswer = escapeHtml(question.answer);
            const markedTitle = marked.parse(escapedTitle);
            const markedAnswer = marked.parse(escapedAnswer);
            const encodedTitle = encodeURIComponent(question.title);
            const encodedAnswer = encodeURIComponent(question.answer);



            const html = template
                .replace(/{{id}}/g, question.id)
                .replace('{{title}}', question.title) // Keep original for other uses
                .replace('{{answer}}', question.answer) // Keep original for other uses
                .replace('{{encodedTitle}}', encodedTitle) // Use encoded for onclick
                .replace('{{encodedAnswer}}', encodedAnswer) // Use encoded for onclick
                .replace('{{{markedTitle}}}', markedTitle) // Use parsed markdown
                .replace('{{{markedAnswer}}}', markedAnswer); // Use parsed markdown

            const div = document.createElement('div');
            div.innerHTML = html;
            questionList.appendChild(div);
        });

        // Update pagination info
        window.currentPage = data.pageNum;
        window.totalPages = data.totalPages;
        const pageInfo = document.getElementById('pageInfo');
        pageInfo.textContent = `Page ${window.currentPage} of ${window.totalPages}`;
        document.getElementById('pagination').style.display = window.totalPages > 1 ? 'flex' : 'none';
        document.getElementById('prevPage').disabled = window.currentPage === 1;
        document.getElementById('nextPage').disabled = window.currentPage === window.totalPages;
    } catch (error) {
        console.error('Error fetching questions:', error);
        alert('Error searching questions: ' + error.message);
    }
};

// Add Question Modal Functions
function openAddModal() {
    document.getElementById('addQuestionModal').classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open

    // Reset form
    document.getElementById('questionForm').reset();

    // Auto-resize any textareas
    const textareas = document.querySelectorAll('#addQuestionModal textarea');
    textareas.forEach(textarea => {
        textarea.style.height = 'auto';
    });
}

function closeAddModal() {
    document.getElementById('addQuestionModal').classList.remove('show');
    document.body.style.overflow = ''; // Enable scrolling again
}

// Update the updateQuestion function to decode the parameters
function updateQuestion(id, encodedTitle, encodedAnswer) {
    const title = decodeURIComponent(encodedTitle);
    const answer = decodeURIComponent(encodedAnswer);

    document.getElementById('updateId').value = id;
    document.getElementById('updateTitle').value = title;
    document.getElementById('updateAnswer').value = answer;

    // Auto-resize textareas
    const textareas = document.querySelectorAll('#updateModal textarea');
    textareas.forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    });

    // Show the modal - Make sure to use display property directly
    const modal = document.getElementById('updateModal');
    modal.classList.add('show');
    modal.style.display = 'flex'; // 修改为flex以触发居中样式
    document.body.style.overflow = 'hidden'; // Prevent scrolling

    console.log("Update modal opened for ID:", id); // Add logging to debug
}

// Update the closeUpdateModal function as well
function closeUpdateModal() {
    const modal = document.getElementById('updateModal');
    modal.classList.remove('show');
    modal.style.display = 'none'; // Explicitly remove display
    document.body.style.overflow = ''; // Enable scrolling again
    document.getElementById('updateForm').reset();
}

// Delete Question
async function deleteQuestion(id) {
    if (confirm('Are you sure you want to delete this question?')) {
        try {
            const response = await fetch(`/questions/${id}`, {
                method: 'DELETE'
            });
            const result = await response.text();
            alert(result);
            document.getElementById('searchForm').dispatchEvent(new Event('submit')); // Refresh the list
        } catch (error) {
            alert('Error deleting question: ' + error.message);
        }
    }
}

// Pagination Functions
async function changePage(direction) {
    const keyword = document.getElementById('searchKeyword').value;
    window.currentPage += direction;
    await window.fetchQuestions(keyword, window.currentPage);
}

function jumpToPage() {
    const pageInput = document.getElementById('pageInput');
    const page = parseInt(pageInput.value);
    if (page >= 1 && page <= window.totalPages) {
        window.currentPage = page;
        const keyword = document.getElementById('searchKeyword').value;
        window.fetchQuestions(keyword, window.currentPage);
    } else {
        alert(`Please enter a page number between 1 and ${window.totalPages}`);
    }
}

// Scroll Functions
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

// Sidebar Toggle Function
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');

    // Mobile handling
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
    }
}

// Question item toggle
function toggleQuestion(header) {
    const item = header.closest('.question-item');
    const btn = item.querySelector('.toggle-btn');

    item.classList.toggle('collapsed');
    btn.textContent = item.classList.contains('collapsed') ? '▶' : '▼';
}

// Event Listeners

// Modal backdrop click to close
window.onclick = function(event) {
    const addModal = document.getElementById('addQuestionModal');
    const updateModal = document.getElementById('updateModal');

    if (event.target === addModal) {
        closeAddModal();
    } else if (event.target === updateModal) {
        closeUpdateModal();
    }

    // Close sidebar on mobile when clicking outside
    if (window.innerWidth <= 768 &&
        !event.target.closest('.sidebar') &&
        !event.target.closest('.sidebar-toggle')) {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }
}

// Escape key to close modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeAddModal();
        closeUpdateModal();
    }
});

// 新增功能：模块折叠
function toggleSection(header) {
    const section = header.parentElement;
    const content = section.querySelector('.section-content');
    content.classList.toggle('collapsed');
    header.innerHTML = header.innerHTML.includes('▼') ?
        header.innerHTML.replace('▼', '▶') :
        header.innerHTML.replace('▶', '▼');
}

// 更新copyContent函数
function copyContent(btn) {
    const item = btn.closest('.question-item');
    const answer = item.querySelector('.question-answer').textContent;
    navigator.clipboard.writeText(answer)
        .then(() => alert('Answer copied to clipboard!'))
        .catch(error => alert('Failed to copy content'));
}

