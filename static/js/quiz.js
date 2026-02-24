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

        // Calculate overall AI accuracy from leaderboard data
        this.overallAiAccuracy = this.calculateOverallAiAccuracy();

        this.initializeEventListeners();
        this.loadProgress();
    }

    /**
     * Calculate mean accuracy across all models from leaderboard data
     */
    calculateOverallAiAccuracy() {
        const models = window.CONTENTBENCH_DATA?.models || [];
        if (models.length === 0) return 69; // fallback
        const sum = models.reduce((acc, m) => acc + (m.accuracy || 0), 0);
        return Math.round(sum / models.length);
    }

    /**
     * Calculate AI accuracy for a specific set of posts using per-item data
     */
    calculateSetAiAccuracy(setStart, setEnd) {
        let aiCorrectSum = 0;
        let aiTotalItems = 0;
        for (let i = setStart; i < setEnd; i++) {
            const post = this.shuffledPosts[i];
            if (post.models_correct !== undefined && post.models_total) {
                aiCorrectSum += post.models_correct / post.models_total;
                aiTotalItems++;
            }
        }
        return aiTotalItems > 0
            ? Math.round((aiCorrectSum / aiTotalItems) * 100)
            : this.overallAiAccuracy;
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

        // Modal controls (set complete)
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('continue-quiz').addEventListener('click', () => {
            this.continueToNextSet();
        });

        document.getElementById('restart-set').addEventListener('click', () => {
            this.restartCurrentSet();
        });

        // Modal background click (set complete)
        document.querySelector('#set-complete-modal .modal-background').addEventListener('click', () => {
            this.closeModal();
        });

        // Final results modal controls
        const finalModal = document.getElementById('final-results-modal');
        if (finalModal) {
            finalModal.querySelector('.modal-background').addEventListener('click', () => {
                this.closeFinalModal();
            });
            document.getElementById('close-final-modal').addEventListener('click', () => {
                this.closeFinalModal();
            });
            document.getElementById('final-restart').addEventListener('click', () => {
                this.closeFinalModal();
                this.resetQuiz();
            });
            const leaderboardBtn = document.getElementById('final-leaderboard');
            if (leaderboardBtn) {
                leaderboardBtn.addEventListener('click', () => {
                    this.closeFinalModal();
                    document.getElementById('leaderboard').scrollIntoView({ behavior: 'smooth' });
                });
            }
        }
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

        // Hide per-item AI info
        const aiInfo = document.getElementById('quiz-ai-item-info');
        if (aiInfo) aiInfo.style.display = 'none';

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
            // Show AI info for already-answered posts
            this.showItemAiInfo(post);
        }

        this.updateNavigation();
    }

    /**
     * Show per-item AI accuracy after user answers
     */
    showItemAiInfo(post) {
        const aiInfo = document.getElementById('quiz-ai-item-info');
        if (!aiInfo || post.models_correct === undefined) return;

        const modelsCorrect = post.models_correct;
        const modelsTotal = post.models_total || 59;
        const pct = Math.round((modelsCorrect / modelsTotal) * 100);

        let colorClass = 'is-info';
        if (pct < 50) colorClass = 'is-danger';
        else if (pct < 80) colorClass = 'is-warning';
        else colorClass = 'is-success';

        aiInfo.innerHTML = `<span class="tag ${colorClass} is-medium">${modelsCorrect}/${modelsTotal} AI models (${pct}%) classified this correctly</span>`;
        aiInfo.style.display = 'block';
    }

    selectCategory(categoryCode, buttonElement) {
        // Remove previous selections in this post
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('is-success', 'is-danger', 'is-selected');
        });

        // Check if answer is correct
        const post = this.shuffledPosts[this.currentPost];
        const correctAnswer = post.ground_truth;
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

        // Show per-item AI accuracy
        this.showItemAiInfo(post);

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

        // Calculate AI accuracy for this specific set of posts
        const aiAccuracy = this.calculateSetAiAccuracy(setStart, setEnd);

        // Show modal
        this.showSetCompleteModal(correct, total, accuracy, aiAccuracy);
        this.saveProgress();
    }

    showSetCompleteModal(correct, total, accuracy, aiAccuracy) {
        document.getElementById('set-score-title').textContent = `You scored ${correct}/${total}!`;
        const safeAccuracy = isNaN(accuracy) ? 0 : accuracy;
        document.getElementById('user-accuracy').textContent = `${safeAccuracy}%`;

        document.getElementById('ai-accuracy').textContent = `${aiAccuracy}%`;

        const feedback = document.getElementById('set-feedback');
        const totalModels = window.CONTENTBENCH_DATA?.models?.length || 59;

        if (safeAccuracy >= 95) {
            feedback.className = 'notification is-success is-light';
            feedback.textContent = `Excellent! You're matching the best AI models (top 10 of ${totalModels} scored 97%+).`;
        } else if (safeAccuracy >= 80) {
            feedback.className = 'notification is-success is-light';
            feedback.textContent = `Great work! You're beating most AI models. The average across ${totalModels} models was ${this.overallAiAccuracy}%.`;
        } else if (safeAccuracy >= 60) {
            feedback.className = 'notification is-warning is-light';
            feedback.textContent = `Solid performance! You're near the AI average (${this.overallAiAccuracy}% across ${totalModels} models). Sarcasm detection is the hardest part.`;
        } else {
            feedback.className = 'notification is-info is-light';
            feedback.textContent = `These are tricky! Many smaller AI models scored similarly. Sarcasm that mimics genuine praise fools both humans and machines.`;
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

    closeFinalModal() {
        document.getElementById('final-results-modal').classList.remove('is-active');
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
        const categoryStats = {};

        window.QUIZ_CATEGORIES.forEach(cat => {
            categoryStats[cat.code] = { correct: 0, total: 0, name: cat.name, icon: cat.icon };
        });

        this.shuffledPosts.forEach((post, i) => {
            const answer = this.userAnswers[i];
            if (answer) {
                totalAnswered++;
                if (answer.correct) totalCorrect++;
                const cat = post.ground_truth;
                if (categoryStats[cat]) {
                    categoryStats[cat].total++;
                    if (answer.correct) categoryStats[cat].correct++;
                }
            }
        });

        const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
        const aiAvg = this.overallAiAccuracy;
        const totalModels = window.CONTENTBENCH_DATA?.models?.length || 59;

        // Build category breakdown HTML
        let catHtml = '';
        for (const [code, stats] of Object.entries(categoryStats)) {
            if (stats.total === 0) continue;
            const catAcc = Math.round((stats.correct / stats.total) * 100);
            let barColor = catAcc >= 80 ? 'is-success' : catAcc >= 60 ? 'is-warning' : 'is-danger';
            catHtml += `
                <div style="margin-bottom: 0.5rem;">
                    <div class="level is-mobile" style="margin-bottom: 0.25rem;">
                        <div class="level-left"><span>${stats.icon} ${stats.name}</span></div>
                        <div class="level-right"><strong>${stats.correct}/${stats.total} (${catAcc}%)</strong></div>
                    </div>
                    <progress class="progress ${barColor} is-small" value="${catAcc}" max="100">${catAcc}%</progress>
                </div>`;
        }

        // Determine rank among models
        const models = window.CONTENTBENCH_DATA?.models || [];
        let rank = models.length + 1;
        for (let i = 0; i < models.length; i++) {
            if (overallAccuracy >= models[i].accuracy) {
                rank = i + 1;
                break;
            }
        }
        const rankText = rank <= models.length
            ? `You would rank #${rank} out of ${totalModels} models.`
            : `You scored below all ${totalModels} tested models.`;

        // Populate final results modal
        document.getElementById('final-score-title').textContent = `Final Score: ${totalCorrect}/${totalAnswered}`;
        document.getElementById('final-user-accuracy').textContent = `${overallAccuracy}%`;
        document.getElementById('final-ai-accuracy').textContent = `${aiAvg}%`;
        document.getElementById('final-rank-text').textContent = rankText;
        document.getElementById('final-category-breakdown').innerHTML = catHtml;

        // Feedback
        const feedback = document.getElementById('final-feedback');
        if (overallAccuracy >= 95) {
            feedback.className = 'notification is-success is-light';
            feedback.textContent = `Outstanding! You matched the best AI models. The top 10 scored 97%+.`;
        } else if (overallAccuracy >= 80) {
            feedback.className = 'notification is-success is-light';
            feedback.textContent = `Excellent! You outperformed most of the ${totalModels} AI models tested (average: ${aiAvg}%).`;
        } else if (overallAccuracy >= 60) {
            feedback.className = 'notification is-warning is-light';
            feedback.textContent = `Solid result! You're near the AI average of ${aiAvg}%. Sarcasm detection is where both humans and smaller models struggle.`;
        } else {
            feedback.className = 'notification is-info is-light';
            feedback.textContent = `Sarcasm is hard! Many AI models scored similarly. The posts are designed to be adversarial.`;
        }

        // Show modal
        document.getElementById('final-results-modal').classList.add('is-active');
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

        // Hide AI info
        const aiInfo = document.getElementById('quiz-ai-item-info');
        if (aiInfo) aiInfo.style.display = 'none';

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
