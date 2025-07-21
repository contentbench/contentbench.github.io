/**
 * Interactive Quiz for ContentBench
 * Allows users to test their classification skills against actual dataset posts
 */

class ContentBenchQuiz {
    constructor() {
        this.currentPost = 0;
        this.currentSet = 0;
        this.postsPerSet = 10;
        
        // Shuffle posts to mix categories for better challenge
        this.shuffledPosts = this.shuffleArray([...window.QUIZ_DATA]);
        this.totalSets = Math.ceil(this.shuffledPosts.length / this.postsPerSet);
        this.userAnswers = new Array(this.shuffledPosts.length).fill(null);
        this.setScores = new Array(this.totalSets).fill(null);
        this.quizStarted = false;
        
        this.initializeEventListeners();
        this.loadProgress();
    }

    /**
     * Fisher-Yates shuffle algorithm to randomize post order
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    initializeEventListeners() {
        // Start quiz button
        document.getElementById('start-quiz').addEventListener('click', () => {
            this.startQuiz();
        });

        // Navigation buttons
        document.getElementById('quiz-prev').addEventListener('click', () => {
            this.previousPost();
        });

        document.getElementById('quiz-next').addEventListener('click', () => {
            this.nextPost();
        });

        // Reset button
        document.getElementById('quiz-reset').addEventListener('click', () => {
            this.resetQuiz();
        });

        // Modal controls
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('continue-quiz').addEventListener('click', () => {
            this.continueToNextSet();
        });

        document.getElementById('restart-set').addEventListener('click', () => {
            this.restartCurrentSet();
        });

        // Modal background click
        document.querySelector('.modal-background').addEventListener('click', () => {
            this.closeModal();
        });
    }

    startQuiz() {
        this.quizStarted = true;
        document.getElementById('quiz-start').style.display = 'none';
        document.getElementById('quiz-interface').style.display = 'block';
        document.querySelector('.quiz-controls').style.display = 'block';
        
        this.generateCategoryButtons();
        this.loadCurrentPost();
        this.updateProgress();
    }

    generateCategoryButtons() {
        const container = document.querySelector('.category-buttons .columns');
        container.innerHTML = '';

        window.QUIZ_CATEGORIES.forEach(category => {
            const button = document.createElement('div');
            button.className = 'column is-half-tablet is-one-third-desktop';
            button.innerHTML = `
                <button class="button is-fullwidth category-btn" data-category="${category.code}">
                    <span class="icon">${category.icon}</span>
                    <span>${category.name}</span>
                </button>
            `;
            container.appendChild(button);

            // Add click handler
            const btnElement = button.querySelector('.category-btn');
            btnElement.addEventListener('click', () => {
                this.selectCategory(category.code, btnElement);
            });
        });
    }

    loadCurrentPost() {
        const post = this.shuffledPosts[this.currentPost];
        document.getElementById('quiz-post-text').textContent = post.text;
        
        // Reset category button states
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('is-success', 'is-danger', 'is-selected');
        });

        // Show previous answer if exists
        if (this.userAnswers[this.currentPost]) {
            const answer = this.userAnswers[this.currentPost];
            const correctBtn = document.querySelector(`[data-category="${answer.selected}"]`);
            if (correctBtn) {
                correctBtn.classList.add('is-selected');
                if (answer.correct) {
                    correctBtn.classList.add('is-success');
                } else {
                    correctBtn.classList.add('is-danger');
                }
            }
        }

        this.updateNavigation();
    }

    selectCategory(categoryCode, buttonElement) {
        // Remove previous selections in this post
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('is-success', 'is-danger', 'is-selected');
        });

        // Check if answer is correct
        const correctAnswer = this.shuffledPosts[this.currentPost].ground_truth;
        const isCorrect = categoryCode === correctAnswer;

        // Style the button
        buttonElement.classList.add('is-selected');
        if (isCorrect) {
            buttonElement.classList.add('is-success');
        } else {
            buttonElement.classList.add('is-danger');
        }

        // Store the answer
        this.userAnswers[this.currentPost] = {
            selected: categoryCode,
            correct: isCorrect,
            groundTruth: correctAnswer
        };

        // Enable next button
        document.getElementById('quiz-next').disabled = false;

        // Save progress
        this.saveProgress();

        // Auto-advance after 1.5 seconds if not on last post of set
        const postInSet = this.currentPost % this.postsPerSet;
        if (postInSet < this.postsPerSet - 1) {
            setTimeout(() => {
                if (this.userAnswers[this.currentPost]) { // Still answered
                    this.nextPost();
                }
            }, 1500);
        } else {
            // Last post of set - show completion after delay
            setTimeout(() => {
                if (this.userAnswers[this.currentPost]) {
                    this.completeSet();
                }
            }, 1500);
        }
    }

    nextPost() {
        if (this.currentPost < this.shuffledPosts.length - 1) {
            this.currentPost++;
            this.loadCurrentPost();
            this.updateProgress();
        }
    }

    previousPost() {
        if (this.currentPost > 0) {
            this.currentPost--;
            this.loadCurrentPost();
            this.updateProgress();
        }
    }

    updateProgress() {
        const postInSet = (this.currentPost % this.postsPerSet) + 1;
        const currentSet = Math.floor(this.currentPost / this.postsPerSet) + 1;
        
        document.getElementById('quiz-progress').textContent = `Post ${postInSet} of ${this.postsPerSet}`;
        document.getElementById('quiz-set').textContent = `Set ${currentSet} of ${this.totalSets}`;
        
        // Update score for current set
        this.updateScore();
    }

    updateScore() {
        const currentSet = Math.floor(this.currentPost / this.postsPerSet);
        const setStart = currentSet * this.postsPerSet;
        const setEnd = Math.min(setStart + this.postsPerSet, this.shuffledPosts.length);
        
        let answered = 0;
        let correct = 0;
        
        for (let i = setStart; i < setEnd; i++) {
            if (this.userAnswers[i]) {
                answered++;
                if (this.userAnswers[i].correct) {
                    correct++;
                }
            }
        }
        
        document.getElementById('quiz-score').textContent = `Score: ${correct}/${answered}`;
    }

    updateNavigation() {
        const prevBtn = document.getElementById('quiz-prev');
        const nextBtn = document.getElementById('quiz-next');
        
        prevBtn.disabled = this.currentPost === 0;
        nextBtn.disabled = !this.userAnswers[this.currentPost];
    }

    completeSet() {
        const currentSet = Math.floor(this.currentPost / this.postsPerSet);
        const setStart = currentSet * this.postsPerSet;
        const setEnd = Math.min(setStart + this.postsPerSet, this.shuffledPosts.length);
        
        let correct = 0;
        let total = 0;
        
        for (let i = setStart; i < setEnd; i++) {
            if (this.userAnswers[i]) {
                total++;
                if (this.userAnswers[i].correct) {
                    correct++;
                }
            }
        }
        
        const accuracy = (total > 0 && !isNaN(correct) && !isNaN(total)) ? Math.round((correct / total) * 100) : 0;
        this.setScores[currentSet] = { correct, total, accuracy };
        
        // Show modal
        this.showSetCompleteModal(correct, total, accuracy);
        this.saveProgress();
    }

    showSetCompleteModal(correct, total, accuracy) {
        document.getElementById('set-score-title').textContent = `You scored ${correct}/${total}!`;
        const safeAccuracy = isNaN(accuracy) ? 0 : accuracy;
        document.getElementById('user-accuracy').textContent = `${safeAccuracy}%`;
        
        const aiAccuracy = 85; // Default AI average
        document.getElementById('ai-accuracy').textContent = `${aiAccuracy}%`;
        
        const feedback = document.getElementById('set-feedback');
        if (safeAccuracy >= 90) {
            feedback.className = 'notification is-success is-light';
            feedback.textContent = '🎉 Excellent work! You\'re performing at the level of top AI models!';
        } else if (safeAccuracy >= 70) {
            feedback.className = 'notification is-warning is-light';
            feedback.textContent = '👍 Good job! You\'re doing well, though some AI models might edge you out.';
        } else {
            feedback.className = 'notification is-danger is-light';
            feedback.textContent = '🤔 This is tricky! Even advanced AI models struggle with these nuanced classifications.';
        }
        
        // Show appropriate continue button
        const continueBtn = document.getElementById('continue-quiz');
        if (this.currentPost >= this.shuffledPosts.length - 1) {
            continueBtn.textContent = 'View Final Results';
        } else {
            continueBtn.textContent = 'Continue to Next Set';
        }
        
        // Show modal
        document.getElementById('set-complete-modal').classList.add('is-active');
    }

    closeModal() {
        document.getElementById('set-complete-modal').classList.remove('is-active');
    }

    continueToNextSet() {
        this.closeModal();
        
        if (this.currentPost >= this.shuffledPosts.length - 1) {
            // Quiz complete
            this.showFinalResults();
        } else {
            // Go to next set
            this.currentPost++;
            this.loadCurrentPost();
            this.updateProgress();
        }
    }

    restartCurrentSet() {
        this.closeModal();
        
        // Clear answers for current set
        const currentSet = Math.floor(this.currentPost / this.postsPerSet);
        const setStart = currentSet * this.postsPerSet;
        const setEnd = Math.min(setStart + this.postsPerSet, this.shuffledPosts.length);
        
        for (let i = setStart; i < setEnd; i++) {
            this.userAnswers[i] = null;
        }
        
        // Go to start of current set
        this.currentPost = setStart;
        this.loadCurrentPost();
        this.updateProgress();
        this.saveProgress();
    }

    showFinalResults() {
        // Calculate overall statistics
        let totalCorrect = 0;
        let totalAnswered = 0;
        
        this.userAnswers.forEach(answer => {
            if (answer) {
                totalAnswered++;
                if (answer.correct) {
                    totalCorrect++;
                }
            }
        });
        
        const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
        
        alert(`Quiz Complete!\n\nFinal Score: ${totalCorrect}/${totalAnswered} (${overallAccuracy}%)\n\nThanks for testing your skills against ContentBench!`);
        
        // Option to restart
        if (confirm('Would you like to start over?')) {
            this.resetQuiz();
        }
    }

    resetQuiz() {
        this.currentPost = 0;
        this.currentSet = 0;
        // Re-shuffle posts for new quiz
        this.shuffledPosts = this.shuffleArray([...window.QUIZ_DATA]);
        this.userAnswers = new Array(this.shuffledPosts.length).fill(null);
        this.setScores = new Array(this.totalSets).fill(null);
        this.quizStarted = false;
        
        document.getElementById('quiz-start').style.display = 'block';
        document.getElementById('quiz-interface').style.display = 'none';
        document.querySelector('.quiz-controls').style.display = 'none';
        this.closeModal();
        
        this.clearProgress();
    }

    saveProgress() {
        const progress = {
            currentPost: this.currentPost,
            userAnswers: this.userAnswers,
            setScores: this.setScores,
            quizStarted: this.quizStarted,
            shuffledPosts: this.shuffledPosts
        };
        localStorage.setItem('contentbench-quiz-progress', JSON.stringify(progress));
    }

    loadProgress() {
        const saved = localStorage.getItem('contentbench-quiz-progress');
        if (saved) {
            try {
                const progress = JSON.parse(saved);
                
                if (progress.shuffledPosts && progress.shuffledPosts.length === window.QUIZ_DATA.length) {
                    this.shuffledPosts = progress.shuffledPosts;
                }
                
                this.currentPost = progress.currentPost || 0;
                this.userAnswers = progress.userAnswers || new Array(this.shuffledPosts.length).fill(null);
                this.setScores = progress.setScores || new Array(this.totalSets).fill(null);
                
                if (progress.quizStarted && this.userAnswers.some(a => a !== null)) {
                    if (confirm('You have previous quiz progress. Would you like to continue where you left off?')) {
                        this.quizStarted = true;
                        this.startQuiz();
                    }
                }
            } catch (e) {
                console.error('Error loading quiz progress:', e);
            }
        }
    }

    clearProgress() {
        localStorage.removeItem('contentbench-quiz-progress');
    }
}

// Initialize quiz when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (window.QUIZ_DATA && window.QUIZ_CATEGORIES) {
        new ContentBenchQuiz();
    }
});