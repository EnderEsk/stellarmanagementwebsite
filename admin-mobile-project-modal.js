/**
 * Mobile Project Creation/Editing Bottom Sheet Modal
 * Handles the mobile-specific bottom sheet modal for project creation and editing
 */

class MobileProjectModal {
    constructor() {
        this.isOpen = false;
        this.currentProject = null;
        this.isEditing = false;
        this.imageFiles = [];
        this.deletedImageIndices = [];
        this.projectTags = [];
        this.selectedIcon = 'fa-tree';
        this.publishedStatus = false;
        
        // Available icon options for custom tags
        this.availableIcons = [
            'fa-tree', 'fa-cut', 'fa-scissors', 'fa-leaf',
            'fa-seedling', 'fa-exclamation-triangle', 'fa-tools',
            'fa-broom', 'fa-wrench', 'fa-cog', 'fa-calendar-check',
            'fa-stethoscope', 'fa-fire', 'fa-snowflake', 'fa-wind'
        ];
        
        // Predefined tags for quick selection
        this.predefinedTags = [
            { icon: 'fa-cut', label: 'Tree Removal' },
            { icon: 'fa-scissors', label: 'Pruning' },
            { icon: 'fa-scissors', label: 'Trimming' },
            { icon: 'fa-cog', label: 'Stump Grinding' },
            { icon: 'fa-broom', label: 'Cleanup' },
            { icon: 'fa-tools', label: 'Crane Work' },
            { icon: 'fa-wrench', label: 'Maintenance' },
            { icon: 'fa-exclamation-triangle', label: 'Emergency' }
        ];
        
        this.init();
    }

    init() {
        // Create the modal HTML structure
        this.createModalStructure();
        
        // Add event listeners
        this.addEventListeners();
        
        // Make functions globally available
        this.makeGloballyAvailable();
    }

    createModalStructure() {
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'mobileProjectSheet';
        modalContainer.className = 'mobile-project-sheet';
        
        modalContainer.innerHTML = `
            <div class="mobile-project-sheet-backdrop"></div>
            <div class="mobile-project-sheet-content">
                <div class="mobile-project-sheet-header">
                    <h3 class="mobile-project-sheet-title">Create Project</h3>
                    <button class="mobile-project-sheet-close" onclick="mobileProjectModal.close()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="mobile-project-sheet-body" id="mobileProjectSheetBody">
                    <!-- Content will be populated here -->
                </div>
            </div>
        `;
        
        // Append to body
        document.body.appendChild(modalContainer);
    }

    addEventListeners() {
        // Close on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('mobile-project-sheet-backdrop')) {
                this.close();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Prevent body scroll when modal is open
        this.preventBodyScroll();
    }

    preventBodyScroll() {
        const modal = document.getElementById('mobileProjectSheet');
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const hasShowClass = modal.classList.contains('show');
                    if (hasShowClass) {
                        document.body.style.overflow = 'hidden';
                    } else {
                        document.body.style.overflow = '';
                    }
                }
            });
        });
        
        observer.observe(modal, { attributes: true });
    }

    async show(projectId) {
        // Only show on mobile screens
        if (window.innerWidth >= 768) {
            // Fall back to desktop modal - handled by admin-projects.js
            return;
        }

        if (projectId) {
            // Editing existing project
            this.isEditing = true;
            
            try {
                const response = await fetch(`/api/projects/${projectId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const projectData = await response.json();
                this.currentProject = projectData;
                this.imageFiles = [];
                this.deletedImageIndices = [];
                this.publishedStatus = this.currentProject.published || false;
                
                // Load tags
                this.projectTags = this.parseTags(this.currentProject.tags);
                this.selectedIcon = 'fa-tree';
            } catch (error) {
                console.error('Error loading project:', error);
                if (typeof showNotification === 'function') {
                    showNotification('Failed to load project details', 'error');
                }
                return;
            }
        } else {
            // Creating new project
            this.isEditing = false;
            this.currentProject = null;
            this.imageFiles = [];
            this.deletedImageIndices = [];
            this.projectTags = [];
            this.selectedIcon = 'fa-tree';
            this.publishedStatus = false;
        }

        this.populateContent();
        this.openModal();
    }

    populateContent() {
        const body = document.getElementById('mobileProjectSheetBody');
        const title = this.isEditing ? 'Edit Project' : 'Create New Project';
        
        // Update title
        document.querySelector('.mobile-project-sheet-title').textContent = title;

        body.innerHTML = `
            <!-- Basic Info Section -->
            <div class="mobile-project-section">
                <h4 class="mobile-project-section-title">
                    <i class="fas fa-info-circle"></i>
                    Basic Information
                </h4>
                
                <div class="mobile-project-field">
                    <label class="mobile-project-label">Title *</label>
                    <input type="text" id="mobileProjectTitle" class="mobile-project-input" 
                           value="${this.currentProject?.title || ''}" 
                           placeholder="Project title" required>
                </div>
                
                <div class="mobile-project-field">
                    <label class="mobile-project-label">Duration *</label>
                    <input type="text" id="mobileProjectDuration" class="mobile-project-input" 
                           value="${this.currentProject?.duration || ''}" 
                           placeholder="e.g., 2 Hours" required>
                </div>
                
                <div class="mobile-project-field">
                    <label class="mobile-project-label">Location *</label>
                    <input type="text" id="mobileProjectLocation" class="mobile-project-input" 
                           value="${this.currentProject?.location || ''}" 
                           placeholder="e.g., Calgary NW" required>
                </div>
            </div>

            <!-- Tags Section -->
            <div class="mobile-project-section">
                <h4 class="mobile-project-section-title">
                    <i class="fas fa-tags"></i>
                    Project Tags
                </h4>
                
                <div class="mobile-project-field">
                    <label class="mobile-project-label">Quick Tags</label>
                    <div class="mobile-project-predefined-tags">
                        ${this.getPredefinedTagsHTML()}
                    </div>
                </div>
                
                <div class="mobile-project-field">
                    <label class="mobile-project-label">Create Custom Tag</label>
                    <div class="mobile-project-custom-tag-creator">
                        <div class="mobile-project-icon-picker">
                            <button type="button" class="mobile-project-icon-picker-btn" id="mobileProjectIconBtn">
                                <i class="fas ${this.selectedIcon}"></i>
                            </button>
                            <div class="mobile-project-icon-picker-dropdown" id="mobileProjectIconDropdown">
                                ${this.getIconPickerHTML()}
                            </div>
                        </div>
                        <input type="text" id="mobileProjectCustomTagInput" class="mobile-project-input" 
                               placeholder="Tag name..." maxlength="30" style="flex: 1;">
                        <button type="button" class="mobile-project-add-tag-btn" id="mobileProjectAddTagBtn">
                            <i class="fas fa-plus"></i> Add
                        </button>
                    </div>
                </div>
                
                <div class="mobile-project-field">
                    <label class="mobile-project-label">Active Tags</label>
                    <div class="mobile-project-active-tags ${this.projectTags.length === 0 ? 'no-tags' : ''}" id="mobileProjectActiveTags">
                        ${this.getActiveTagsHTML()}
                    </div>
                </div>
            </div>

            <!-- Description Section -->
            <div class="mobile-project-section">
                <h4 class="mobile-project-section-title">
                    <i class="fas fa-align-left"></i>
                    Description
                </h4>
                
                <div class="mobile-project-field">
                    <label class="mobile-project-label">Description *</label>
                    <textarea id="mobileProjectDescription" class="mobile-project-textarea" 
                              placeholder="Describe the project details..." required>${this.currentProject?.description || ''}</textarea>
                </div>
            </div>

            <!-- Images Section -->
            <div class="mobile-project-section">
                <h4 class="mobile-project-section-title">
                    <i class="fas fa-images"></i>
                    Project Images
                </h4>
                
                <div class="mobile-project-image-upload-area" onclick="document.getElementById('mobileProjectImageInput').click()">
                    <div class="mobile-project-image-upload-icon">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <div class="mobile-project-image-upload-text">
                        ${this.isEditing ? 'Tap to add more images' : 'Tap to upload images'}
                    </div>
                    <div class="mobile-project-image-upload-hint">
                        JPG, PNG (max 10MB each, up to 10 images)
                    </div>
                </div>
                <input type="file" id="mobileProjectImageInput" name="images" multiple 
                       accept="image/*" style="display: none;" onchange="mobileProjectModal.handleImageUpload(event)">
                
                <div class="mobile-project-image-preview-grid" id="mobileProjectImageGrid">
                    ${this.getImagePreviewsHTML()}
                </div>
            </div>

            <!-- Publication Status Section -->
            <div class="mobile-project-section">
                <h4 class="mobile-project-section-title">
                    <i class="fas fa-eye"></i>
                    Publication Status
                </h4>
                
                <div class="mobile-project-publish-toggle">
                    <button type="button" class="mobile-project-toggle-segment ${this.publishedStatus ? 'active' : ''}" 
                            data-status="published" onclick="mobileProjectModal.togglePublished()">
                        <i class="fas fa-eye"></i> Published
                    </button>
                    <button type="button" class="mobile-project-toggle-segment ${!this.publishedStatus ? 'active' : ''}" 
                            data-status="unpublished" onclick="mobileProjectModal.toggleUnpublished()">
                        <i class="fas fa-eye-slash"></i> Unpublished
                    </button>
                </div>
            </div>

            <!-- Actions Section -->
            <div class="mobile-project-actions">
                ${this.isEditing ? `
                <button type="button" class="mobile-project-action-btn delete" onclick="mobileProjectModal.handleDeleteProject('${this.currentProject.project_id}')">
                    <i class="fas fa-trash"></i> Delete Project
                </button>
                ` : ''}
                <button type="button" class="mobile-project-action-btn cancel" onclick="mobileProjectModal.close()">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="button" class="mobile-project-action-btn save" onclick="mobileProjectModal.handleFormSubmit()">
                    <i class="fas fa-save"></i> ${this.isEditing ? 'Update Project' : 'Create Project'}
                </button>
            </div>
        `;

        // Add event listeners for tag operations
        this.setupTagEventListeners();
    }

    setupTagEventListeners() {
        // Icon picker toggle
        document.addEventListener('click', (e) => {
            if (e.target.id === 'mobileProjectIconBtn' || e.target.closest('#mobileProjectIconBtn')) {
                this.toggleIconPicker();
            }
            
            // Close icon picker when clicking outside
            if (!e.target.closest('.mobile-project-icon-picker')) {
                const dropdown = document.getElementById('mobileProjectIconDropdown');
                if (dropdown) dropdown.classList.remove('active');
            }
            
            // Add custom tag
            if (e.target.id === 'mobileProjectAddTagBtn' || e.target.closest('#mobileProjectAddTagBtn')) {
                this.addCustomTag();
            }
        });
    }

    getPredefinedTagsHTML() {
        return this.predefinedTags.map(tag => `
            <button type="button" class="mobile-project-predefined-tag" 
                    data-icon="${tag.icon}" 
                    data-label="${tag.label}"
                    onclick="mobileProjectModal.addPredefinedTag('${tag.icon}', '${tag.label}')">
                <i class="fas ${tag.icon}"></i>
                <span>${tag.label}</span>
            </button>
        `).join('');
    }

    getIconPickerHTML() {
        return this.availableIcons.map(icon => `
            <button type="button" class="mobile-project-icon-option" 
                    data-icon="${icon}"
                    onclick="mobileProjectModal.selectIcon('${icon}')">
                <i class="fas ${icon}"></i>
            </button>
        `).join('');
    }

    getActiveTagsHTML() {
        if (this.projectTags.length === 0) {
            return '<p class="mobile-project-no-tags">No tags added yet</p>';
        }
        
        return this.projectTags.map((tag, index) => `
            <div class="mobile-project-tag">
                <i class="fas ${tag.icon || 'fa-tree'}"></i>
                <span>${tag.label || 'Unknown'}</span>
                <button type="button" class="mobile-project-remove-tag-btn" 
                        onclick="mobileProjectModal.removeTag(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    getImagePreviewsHTML() {
        let html = '';
        
        // Show existing images (if editing)
        if (this.isEditing && this.currentProject && this.currentProject.image_previews) {
            this.currentProject.image_previews.forEach((imageName, index) => {
                if (this.deletedImageIndices.includes(index)) {
                    return;
                }
                
                const imageUrl = `/api/projects/images/${this.currentProject.project_id}/${index}`;
                html += `
                    <div class="mobile-project-image-preview-item" data-image-index="${index}">
                        <img src="${imageUrl}" alt="${imageName}" onerror="this.src='../images/placeholder.jpg'">
                        <button type="button" class="mobile-project-remove-image-btn" 
                                onclick="mobileProjectModal.removeExistingImage(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            });
        }
        
        // Show new uploaded images
        this.imageFiles.forEach((file, index) => {
            if (!file.previewUrl) {
                file.previewUrl = URL.createObjectURL(file);
            }
            
            html += `
                <div class="mobile-project-image-preview-item" data-new-index="${index}">
                    <img src="${file.previewUrl}" alt="${file.name}">
                    <button type="button" class="mobile-project-remove-image-btn" 
                            onclick="mobileProjectModal.removeNewImage(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        
        return html;
    }

    toggleIconPicker() {
        const dropdown = document.getElementById('mobileProjectIconDropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }

    selectIcon(iconClass) {
        this.selectedIcon = iconClass;
        const btn = document.getElementById('mobileProjectIconBtn');
        if (btn) {
            btn.innerHTML = `<i class="fas ${iconClass}"></i>`;
        }
        
        const dropdown = document.getElementById('mobileProjectIconDropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }

    addPredefinedTag(icon, label) {
        if (this.projectTags.some(t => t.label === label)) {
            if (typeof showNotification === 'function') {
                showNotification('Tag already added', 'error');
            }
            return;
        }
        
        this.projectTags.push({ icon, label });
        this.updateActiveTags();
    }

    addCustomTag() {
        const input = document.getElementById('mobileProjectCustomTagInput');
        if (!input) return;
        
        const label = input.value.trim();
        
        if (!label) {
            if (typeof showNotification === 'function') {
                showNotification('Please enter a tag name', 'error');
            }
            return;
        }
        
        if (this.projectTags.some(t => t.label === label)) {
            if (typeof showNotification === 'function') {
                showNotification('Tag already exists', 'error');
            }
            return;
        }
        
        const icon = this.selectedIcon || 'fa-tree';
        this.projectTags.push({ icon, label });
        
        input.value = '';
        this.selectIcon('fa-tree');
        
        this.updateActiveTags();
    }

    removeTag(index) {
        this.projectTags.splice(index, 1);
        this.updateActiveTags();
    }

    updateActiveTags() {
        const container = document.getElementById('mobileProjectActiveTags');
        if (container) {
            container.innerHTML = this.getActiveTagsHTML();
            if (this.projectTags.length === 0) {
                container.classList.add('no-tags');
            } else {
                container.classList.remove('no-tags');
            }
        }
    }

    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        const maxFiles = 10;
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        const existingCount = this.isEditing && this.currentProject 
            ? (this.currentProject.image_previews.length - this.deletedImageIndices.length)
            : 0;
        const currentTotal = existingCount + this.imageFiles.length;
        
        files.forEach(file => {
            if (this.imageFiles.length + currentTotal >= maxFiles) {
                if (typeof showNotification === 'function') {
                    showNotification(`Maximum ${maxFiles} images allowed`, 'error');
                }
                return;
            }
            
            if (file.size > maxSize) {
                if (typeof showNotification === 'function') {
                    showNotification(`Image ${file.name} is too large. Maximum size is 10MB`, 'error');
                }
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                if (typeof showNotification === 'function') {
                    showNotification(`File ${file.name} is not an image`, 'error');
                }
                return;
            }
            
            this.imageFiles.push(file);
        });
        
        const fileInput = document.getElementById('mobileProjectImageInput');
        if (fileInput) {
            fileInput.value = '';
        }
        
        this.updateImagePreviews();
    }

    removeExistingImage(index) {
        if (this.currentProject && this.currentProject.image_previews) {
            if (!this.deletedImageIndices.includes(index)) {
                this.deletedImageIndices.push(index);
            }
            this.updateImagePreviews();
        }
    }

    removeNewImage(index) {
        const file = this.imageFiles[index];
        if (file && file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl);
        }
        
        this.imageFiles.splice(index, 1);
        this.updateImagePreviews();
    }

    updateImagePreviews() {
        const previewGrid = document.getElementById('mobileProjectImageGrid');
        if (previewGrid) {
            previewGrid.innerHTML = this.getImagePreviewsHTML();
        }
    }

    togglePublished() {
        this.publishedStatus = true;
        this.updateToggleButtons();
    }

    toggleUnpublished() {
        this.publishedStatus = false;
        this.updateToggleButtons();
    }

    updateToggleButtons() {
        const publishedBtn = document.querySelector('.mobile-project-toggle-segment[data-status="published"]');
        const unpublishedBtn = document.querySelector('.mobile-project-toggle-segment[data-status="unpublished"]');
        
        if (publishedBtn) {
            if (this.publishedStatus) {
                publishedBtn.classList.add('active');
            } else {
                publishedBtn.classList.remove('active');
            }
        }
        
        if (unpublishedBtn) {
            if (!this.publishedStatus) {
                unpublishedBtn.classList.add('active');
            } else {
                unpublishedBtn.classList.remove('active');
            }
        }
    }

    async handleFormSubmit() {
        // Get form values
        const title = document.getElementById('mobileProjectTitle')?.value.trim();
        const duration = document.getElementById('mobileProjectDuration')?.value.trim();
        const location = document.getElementById('mobileProjectLocation')?.value.trim();
        const description = document.getElementById('mobileProjectDescription')?.value.trim();
        
        // Validate
        if (!title || !duration || !location || !description) {
            if (typeof showNotification === 'function') {
                showNotification('Please fill in all required fields', 'error');
            }
            return;
        }
        
        // Disable buttons and show loading
        this.setFormLoadingState(true);
        
        try {
            const formData = new FormData();
            
            formData.append('title', title);
            formData.append('duration', duration);
            formData.append('location', location);
            formData.append('description', description);
            formData.append('published', this.publishedStatus);
            
            // Add tags as JSON string
            const validTags = this.projectTags
                .filter(tag => tag && typeof tag === 'object' && tag.icon && tag.label)
                .map(tag => ({ icon: tag.icon, label: tag.label }));
            formData.append('tags', JSON.stringify(validTags));
            
            // Add image files
            this.imageFiles.forEach(file => {
                formData.append('images', file);
            });
            
            // Add delete flags if editing
            if (this.isEditing) {
                formData.append('keep_existing_images', 'true');
                formData.append('deleted_image_indices', JSON.stringify(this.deletedImageIndices));
            }
            
            const url = this.isEditing 
                ? `/api/projects/${this.currentProject.project_id}`
                : '/api/projects';
            
            const method = this.isEditing ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save project');
            }
            
            const result = await response.json();
            
            if (typeof showNotification === 'function') {
                showNotification(result.message || 'Project saved successfully', 'success');
            }
            
            this.close();
            
            // Reload projects list in admin-projects.js
            if (typeof window.adminProjects !== 'undefined') {
                window.adminProjects.loadProjects();
            }
            
        } catch (error) {
            console.error('Error saving project:', error);
            if (typeof showNotification === 'function') {
                showNotification(error.message || 'Failed to save project', 'error');
            }
            this.setFormLoadingState(false);
        }
    }

    async handleDeleteProject(projectId) {
        if (!confirm(`Are you sure you want to delete this project? This action cannot be undone.`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete project');
            }
            
            const result = await response.json();
            
            if (typeof showNotification === 'function') {
                showNotification(result.message || 'Project deleted successfully', 'success');
            }
            
            this.close();
            
            // Reload projects list
            if (typeof window.adminProjects !== 'undefined') {
                window.adminProjects.loadProjects();
            }
            
        } catch (error) {
            console.error('Error deleting project:', error);
            if (typeof showNotification === 'function') {
                showNotification(error.message || 'Failed to delete project', 'error');
            }
        }
    }

    setFormLoadingState(isLoading) {
        const submitBtn = document.querySelector('.mobile-project-action-btn.save');
        const allButtons = document.querySelectorAll('.mobile-project-action-btn');
        
        if (isLoading) {
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                submitBtn.disabled = true;
            }
            allButtons.forEach(btn => {
                if (btn !== submitBtn) {
                    btn.disabled = true;
                }
            });
        } else {
            if (submitBtn) {
                const text = this.isEditing ? 'Update Project' : 'Create Project';
                submitBtn.innerHTML = `<i class="fas fa-save"></i> ${text}`;
                submitBtn.disabled = false;
            }
            allButtons.forEach(btn => {
                btn.disabled = false;
            });
        }
    }

    openModal() {
        const modal = document.getElementById('mobileProjectSheet');
        modal.classList.add('show');
        this.isOpen = true;
    }

    close() {
        const modal = document.getElementById('mobileProjectSheet');
        modal.classList.remove('show');
        this.isOpen = false;
        
        // Clean up preview URLs
        this.imageFiles.forEach(file => {
            if (file.previewUrl) {
                URL.revokeObjectURL(file.previewUrl);
            }
        });
        
        // Reset state
        this.imageFiles = [];
        this.deletedImageIndices = [];
        this.projectTags = [];
        this.selectedIcon = 'fa-tree';
        this.currentProject = null;
        this.isEditing = false;
    }

    parseTags(tags) {
        if (!tags || tags === '' || tags === '[]' || (Array.isArray(tags) && tags.length === 0)) {
            return [];
        }
        
        try {
            if (Array.isArray(tags)) {
                return tags.filter(tag => tag && typeof tag === 'object' && tag.icon && tag.label);
            }
            
            if (typeof tags === 'string') {
                const parsed = JSON.parse(tags);
                if (Array.isArray(parsed)) {
                    return parsed.filter(tag => tag && typeof tag === 'object' && tag.icon && tag.label);
                }
            }
        } catch (e) {
            console.error('Error parsing tags:', e);
        }
        
        return [];
    }

    makeGloballyAvailable() {
        // Make the modal globally accessible
        window.mobileProjectModal = this;
    }
}

// Initialize the mobile project modal when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MobileProjectModal();
});

