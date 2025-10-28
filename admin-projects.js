// Admin Projects Management
class AdminProjects {
    constructor() {
        this.projects = [];
        this.currentProject = null;
        this.isEditing = false;
        this.draggedElement = null;
        this.imageFiles = [];
        this.deletedImageIndices = []; // Track which existing images to delete
        this.projectTags = []; // Active tags for current project
        this.selectedIcon = 'fa-tree'; // Default icon for custom tags
        this.publishedStatus = false; // Default published status
        
        // Performance optimizations
        this.projectsCache = new Map(); // Cache full project data
        this.imageObserver = null; // Reuse IntersectionObserver
        this.modalImagesObserver = null; // Observer for modal images
        this.orderUpdateTimeout = null; // Debounce order updates
        
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
        this.setupEventListeners();
        this.loadProjects();
    }
    
    setupEventListeners() {
        // Create project button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('create-project-btn')) {
                this.showCreateModal();
            }
            
            if (e.target.classList.contains('refresh-projects-btn')) {
                this.loadProjects();
            }
            
            if (e.target.classList.contains('close-modal-btn')) {
                this.closeModal();
            }
            
            // Publish toggle handler
            if (e.target.classList.contains('toggle-segment')) {
                e.preventDefault();
                const toggleButtons = document.querySelectorAll('.toggle-segment');
                toggleButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                // Store the selected status
                this.publishedStatus = e.target.dataset.status === 'published';
            }
            
            // Make entire card clickable to edit (except drag handle)
            if (e.target.closest('.project-card') && !e.target.closest('.drag-handle')) {
                const projectCard = e.target.closest('.project-card');
                const projectId = projectCard.dataset.projectId;
                this.showEditModal(projectId);
            }
        });
        
        // Modal form submission
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('project-form')) {
                const form = e.target;
                
                // Check if form is valid using HTML5 validation
                if (!form.checkValidity()) {
                    e.preventDefault();
                    e.stopPropagation();
                    form.reportValidity(); // Show browser validation messages
                    return;
                }
                
                e.preventDefault();
                this.handleFormSubmit(e.target);
            }
        });
        
        // Image upload handling
        document.addEventListener('change', (e) => {
            if (e.target.type === 'file' && e.target.name === 'images') {
                this.handleImageUpload(e.target.files);
            }
        });
        
        // Drag and drop for images
        document.addEventListener('dragover', (e) => {
            if (e.target.classList.contains('image-upload-area')) {
                e.preventDefault();
                e.target.classList.add('dragover');
            }
        });
        
        document.addEventListener('dragleave', (e) => {
            if (e.target.classList.contains('image-upload-area')) {
                e.target.classList.remove('dragover');
            }
        });
        
        document.addEventListener('drop', (e) => {
            if (e.target.classList.contains('image-upload-area')) {
                e.preventDefault();
                e.target.classList.remove('dragover');
                this.handleImageUpload(e.dataTransfer.files);
            }
        });
        
        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('project-modal')) {
                this.closeModal();
            }
            
            // Icon picker dropdown toggle
            if (e.target.id === 'selectedIconBtn' || e.target.closest('#selectedIconBtn')) {
                this.toggleIconPicker();
            }
            
            // Add custom tag button
            if (e.target.id === 'addCustomTagBtn' || e.target.closest('#addCustomTagBtn')) {
                e.preventDefault();
                this.addCustomTag();
            }
            
            // Close icon picker when clicking outside
            if (!e.target.closest('.icon-picker')) {
                const dropdown = document.getElementById('iconPickerDropdown');
                if (dropdown) dropdown.classList.remove('active');
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.querySelector('.project-modal.active')) {
                this.closeModal();
            }
        });
    }

    async loadProjects() {
        try {
            this.showLoading();
            
            const response = await fetch('/api/projects', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const projects = await response.json();
            this.projects = projects;
            
            // Clear cache when projects are reloaded to ensure data is fresh
            this.projectsCache.clear();
            
            this.renderProjectsGrid();
            
        } catch (error) {
            console.error('Error loading projects:', error);
            this.showError('Failed to load projects. Please try again.');
        }
    }
    
    renderProjectsGrid() {
        const projectsGrid = document.getElementById('projectsGrid');
        
        if (!projectsGrid) {
            console.error('Projects grid container not found');
            return;
        }
        
        if (this.projects.length === 0) {
            projectsGrid.innerHTML = this.getEmptyStateHTML();
            return;
        }
        
        // Sort projects by order, then by date
        const sortedProjects = [...this.projects].sort((a, b) => {
            if (a.order !== b.order) {
                return a.order - b.order;
            }
            return new Date(b.date) - new Date(a.date);
        });
        
        projectsGrid.innerHTML = sortedProjects.map(project => this.createProjectCardHTML(project)).join('');
        
        // Initialize drag and drop for reordering
        this.initDragAndDrop();
        
        // Setup lazy loading for images
        this.setupLazyLoading();
    }
    
    setupLazyLoading() {
        // Reuse the same observer instead of creating new ones
        if (!this.imageObserver) {
            this.imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.getAttribute('data-src');
                        if (src) {
                            img.src = src;
                            img.classList.remove('lazy-load');
                            img.classList.add('loaded');
                        }
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px' // Start loading 50px before visible
            });
        }
        
        document.querySelectorAll('.project-image.lazy-load').forEach(img => {
            this.imageObserver.observe(img);
        });
    }
    
    createProjectCardHTML(project) {
        const mainImage = project.image_previews && project.image_previews.length > 0 
            ? `/api/projects/images/${project.project_id}/0`
            : '../images/placeholder.jpg';
        
        const statusBadges = [];
        if (project.published) {
            statusBadges.push('<span class="status-badge published"><i class="fas fa-eye"></i></span>');
        } else {
            statusBadges.push('<span class="status-badge unpublished"><i class="fas fa-eye-slash"></i></span>');
        }
        
        return `
            <div class="project-card" data-project-id="${project.project_id}" draggable="true">
                <div class="drag-handle" title="Drag to reorder">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                
                <div class="project-image-container">
                    <img src="../images/placeholder.jpg" 
                         data-src="${mainImage}" 
                         alt="${project.title}" 
                         class="project-image lazy-load" 
                         onerror="this.src='../images/placeholder.jpg'">
                    <div class="project-status-badges">
                        ${statusBadges.join('')}
                    </div>
                </div>
                
                <div class="project-content">
                    <h3 class="project-title">${project.title}</h3>
                </div>
            </div>
        `;
    }

    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <h3>No Projects Yet</h3>
                <p>Create your first project to showcase your work</p>
                <button class="create-project-btn">
                    <i class="fas fa-plus"></i> Create Project
                </button>
            </div>
        `;
    }
    
    showCreateModal() {
        // Check if we're on mobile and use mobile modal
        if (window.innerWidth < 768 && typeof window.mobileProjectModal !== 'undefined') {
            window.mobileProjectModal.show(null);
            return;
        }
        
        this.isEditing = false;
        this.currentProject = null;
        this.imageFiles = [];
        this.deletedImageIndices = []; // Reset deleted images tracking
        this.projectTags = []; // Reset tags
        this.selectedIcon = 'fa-tree'; // Reset icon
        this.publishedStatus = false; // Default to unpublished
        this.showModal();
    }
    
    async showEditModal(projectId) {
        // Check if we're on mobile and use mobile modal
        if (window.innerWidth < 768 && typeof window.mobileProjectModal !== 'undefined') {
            window.mobileProjectModal.show(projectId);
            return;
        }
        
        try {
            this.isEditing = true;
            
            // Check cache first
            let projectData = this.projectsCache.get(projectId);
            
            if (!projectData) {
                this.currentProject = this.projects.find(p => p.project_id === projectId);
                
                if (!this.currentProject) {
                    this.showError('Project not found');
                    return;
                }
                
                // Load full project data with images only if not cached
                const response = await fetch(`/api/projects/${projectId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                projectData = await response.json();
                // Cache the full project data (limit cache to 50 items)
                if (this.projectsCache.size >= 50) {
                    const firstKey = this.projectsCache.keys().next().value;
                    this.projectsCache.delete(firstKey);
                }
                this.projectsCache.set(projectId, projectData);
            }
            
            this.currentProject = projectData;
            this.imageFiles = [];
            this.deletedImageIndices = []; // Reset deleted images tracking
            this.publishedStatus = this.currentProject.published || false; // Set published status
            
            // Load tags from project - handle all possible formats
            this.projectTags = this.parseTags(this.currentProject.tags);
            this.selectedIcon = 'fa-tree';
            console.log('Loaded tags:', this.projectTags);
            
            this.showModal();
            
            // Load modal images lazily
            this.setupModalImageLazyLoading();
            
        } catch (error) {
            console.error('Error loading project:', error);
            this.showError('Failed to load project details');
        }
    }
    
    showModal() {
        const modal = document.getElementById('projectModal');
        if (!modal) {
            this.createModal();
        }
        
        const modalElement = document.getElementById('projectModal');
        modalElement.innerHTML = this.getModalHTML();
        modalElement.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Update icon picker button with current selected icon
        const iconBtn = document.getElementById('selectedIconBtn');
        if (iconBtn) {
            iconBtn.innerHTML = `<i class="fas ${this.selectedIcon}"></i>`;
        }
        
        // Focus on first input
        const firstInput = modalElement.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
    
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'projectModal';
        modal.className = 'project-modal';
        document.body.appendChild(modal);
    }
    
    getModalHTML() {
        const title = this.isEditing ? 'Edit Project' : 'Create New Project';
        const submitText = this.isEditing ? 'Update Project' : 'Create Project';
        
        return `
            <div class="project-modal-content">
                <div class="project-modal-header">
                    <h3>${title}</h3>
                    <button class="close-modal-btn" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form class="project-form">
                    <div class="project-modal-body">
                        <!-- 3-Column Row -->
                        <div class="form-row-three-col">
                            <div class="form-group">
                                <label for="projectTitle">Project Title *</label>
                                <input type="text" id="projectTitle" name="title" required 
                                       value="${this.currentProject?.title || ''}">
                            </div>
                            <div class="form-group">
                                <label for="projectDuration">Duration *</label>
                                <input type="text" id="projectDuration" name="duration" required 
                                       placeholder="e.g., 2 Hours" 
                                       value="${this.currentProject?.duration || ''}">
                            </div>
                            <div class="form-group">
                                <label for="projectLocation">Location *</label>
                                <input type="text" id="projectLocation" name="location" required 
                                       placeholder="e.g., Calgary NW" 
                                       value="${this.currentProject?.location || ''}">
                            </div>
                        </div>
                        
                        <!-- Predefined Tags -->
                        <div class="form-group">
                            <label>Quick Tags</label>
                            <div class="predefined-tags">
                                ${this.getPredefinedTagsHTML()}
                            </div>
                        </div>
                        
                        <!-- Custom Tag Creator -->
                        <div class="form-group">
                            <label>Create Custom Tag</label>
                            <div class="custom-tag-creator">
                                <div class="icon-picker">
                                    <button type="button" class="selected-icon-btn" id="selectedIconBtn">
                                        <i class="fas fa-tree"></i>
                                    </button>
                                    <div class="icon-picker-dropdown" id="iconPickerDropdown">
                                        ${this.getIconPickerHTML()}
                                    </div>
                                </div>
                                <input type="text" id="customTagInput" placeholder="Tag name..." maxlength="30">
                                <button type="button" class="add-tag-btn" id="addCustomTagBtn">
                                    <i class="fas fa-plus"></i> Add
                                </button>
                            </div>
                        </div>
                        
                        <!-- Active Tags Display -->
                        <div class="form-group">
                            <label>Project Tags</label>
                            <div class="active-tags" id="activeTags">
                                ${this.getActiveTagsHTML()}
                            </div>
                        </div>
                        
                        <!-- Description -->
                        <div class="form-group">
                            <label for="projectDescription">Description *</label>
                            <textarea id="projectDescription" name="description" required 
                                      placeholder="Describe the project details..." 
                                      rows="6">${this.currentProject?.description || ''}</textarea>
                        </div>
                        
                        <!-- Published Status Toggle -->
                        <div class="form-group">
                            <label>Publication Status</label>
                            <div class="publish-toggle">
                                <button type="button" class="toggle-segment ${this.publishedStatus ? 'active' : ''}" data-status="published">
                                    <i class="fas fa-eye"></i> Published
                                </button>
                                <button type="button" class="toggle-segment ${!this.publishedStatus ? 'active' : ''}" data-status="unpublished">
                                    <i class="fas fa-eye-slash"></i> Unpublished
                                </button>
                            </div>
                        </div>
                    
                    <div class="form-group">
                            <label>Project Images</label>
                            <div class="image-upload-area" onclick="document.getElementById('imageInput').click()">
                                <div class="image-upload-icon">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                </div>
                                <div class="image-upload-text">
                                    ${this.isEditing ? 'Click to upload new images (will be added to existing)' : 'Click to upload images or drag and drop'}
                                </div>
                                <div class="image-upload-hint">Supports JPG, PNG (max 10MB each, up to 10 images)</div>
                            </div>
                            <input type="file" id="imageInput" name="images" multiple 
                                   accept="image/*" style="display: none;">
                            
                            <div class="image-preview-grid" id="imagePreviewGrid">
                                ${this.getImagePreviewsHTML()}
                            </div>
                    </div>
                    </div>
                    
                    <!-- Hidden input to store tags as JSON -->
                    <input type="hidden" name="tags" id="projectTagsInput" value="[]">
                    
                    <div class="project-modal-actions">
                        ${this.isEditing ? `
                            <button type="button" class="modal-btn danger" onclick="adminProjects.handleDeleteProject('${this.currentProject.project_id}')">
                                <i class="fas fa-trash"></i> Delete Project
                            </button>
                        ` : ''}
                        <button type="button" class="modal-btn secondary" onclick="adminProjects.closeModal()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="submit" class="modal-btn primary">
                            <i class="fas fa-save"></i> ${submitText}
                        </button>
                    </div>
                </form>
            </div>
        `;
    }
    
    getImagePreviewsHTML() {
        let html = '';
        
        // Show existing images (if editing), excluding deleted ones
        if (this.isEditing && this.currentProject && this.currentProject.image_previews) {
            this.currentProject.image_previews.forEach((imageName, index) => {
                // Skip images marked for deletion
                if (this.deletedImageIndices.includes(index)) {
                    return;
                }
                
                const imageUrl = `/api/projects/images/${this.currentProject.project_id}/${index}`;
                html += `
                    <div class="image-preview-item existing-image" data-image-index="${index}">
                        <img src="../images/placeholder.jpg" 
                             data-src="${imageUrl}" 
                             alt="${imageName}"
                             class="lazy-load"
                             loading="lazy">
                        <button type="button" class="remove-image-btn" onclick="adminProjects.removeExistingImage(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            });
        }
        
        // Show new uploaded images
        this.imageFiles.forEach((file, index) => {
            // Create or reuse preview URL
            if (!file.previewUrl) {
                file.previewUrl = URL.createObjectURL(file);
            }
            
            html += `
                <div class="image-preview-item new-image" data-new-index="${index}">
                    <img src="${file.previewUrl}" alt="${file.name}">
                    <button type="button" class="remove-image-btn" onclick="adminProjects.removeNewImage(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        
        return html;
    }
    
    getPredefinedTagsHTML() {
        return this.predefinedTags.map(tag => `
            <button type="button" class="predefined-tag" 
                    data-icon="${tag.icon}" 
                    data-label="${tag.label}"
                    onclick="adminProjects.addPredefinedTag('${tag.icon}', '${tag.label}')">
                <i class="fas ${tag.icon}"></i>
                <span>${tag.label}</span>
            </button>
        `).join('');
    }
    
    getIconPickerHTML() {
        return this.availableIcons.map(icon => `
            <button type="button" class="icon-option" 
                    data-icon="${icon}"
                    onclick="adminProjects.selectIcon('${icon}')">
                <i class="fas ${icon}"></i>
            </button>
        `).join('');
    }
    
    parseTags(tags) {
        // Handle null, undefined, empty string, or empty array
        if (!tags || tags === '' || tags === '[]' || (Array.isArray(tags) && tags.length === 0)) {
            return [];
        }
        
        try {
            // If it's already an array, use it
            if (Array.isArray(tags)) {
                // Check if this is an array of corrupted tags (where labels are JSON strings)
                const firstTag = tags[0];
                if (firstTag && typeof firstTag.label === 'string' && firstTag.label.startsWith('[')) {
                    // This is the triple-stringified case - parse the label
                    console.log('Detected corrupted tag format, attempting repair:', firstTag.label);
                    return this.parseTags(firstTag.label);
                }
                return this.validateTags(tags);
            }
            
            // If it's a string, recursively parse until we get an array
            if (typeof tags === 'string') {
                let parsed = tags;
                let attempts = 0;
                const maxAttempts = 10; // Safety limit
                
                // Keep parsing until we get a non-string result
                while (typeof parsed === 'string' && attempts < maxAttempts) {
                    try {
                        parsed = JSON.parse(parsed);
                        attempts++;
                        
                        // If it's now an array, we're done
                        if (Array.isArray(parsed)) {
                            return this.validateTags(parsed);
                        }
                    } catch (e) {
                        console.error('Could not parse tags after', attempts, 'attempts:', e);
                        break;
                    }
                }
                
                // If we ended up with an array somehow
                if (Array.isArray(parsed)) {
                    return this.validateTags(parsed);
                }
            }
        } catch (e) {
            console.error('Error parsing tags:', e, 'Tags value:', tags);
        }
        
        return [];
    }
    
    validateTags(tags) {
        if (!Array.isArray(tags)) {
            return [];
        }
        
        return tags
            .map((tag, index) => {
                // Skip null or undefined
                if (!tag) return null;
                
                // If it's a string, convert to object
                if (typeof tag === 'string') {
                    // If the string is a JSON array, parse it
                    if (tag.trim().startsWith('[')) {
                        try {
                            const parsed = JSON.parse(tag);
                            if (Array.isArray(parsed)) {
                                // Recursively parse the nested array
                                return this.validateTags(parsed);
                            }
                        } catch (e) {
                            // If parsing fails, treat as regular string
                            return { icon: 'fa-tree', label: tag };
                        }
                    }
                    return { icon: 'fa-tree', label: tag };
                }
                
                // If it's an object with both icon and label
                if (typeof tag === 'object' && tag.icon && tag.label) {
                    // Check if the label itself is a JSON string
                    if (typeof tag.label === 'string' && tag.label.trim().startsWith('[')) {
                        console.warn('Found tag with JSON string as label, attempting to repair');
                        try {
                            const labelParsed = JSON.parse(tag.label);
                            if (Array.isArray(labelParsed)) {
                                // This label contains the real tags
                                const realTags = this.validateTags(labelParsed);
                                return realTags.length > 0 ? realTags : null;
                            }
                        } catch (e) {
                            // If parsing fails, use as-is
                        }
                    }
                    
                    // Skip if label is empty or just "["
                    if (tag.label.trim() === '' || tag.label.trim() === '[]' || tag.label.trim() === '[') {
                        return null;
                    }
                    
                    return tag;
                }
                
                // Malformed tag
                console.warn('Invalid tag format at index', index, ':', tag);
                return null;
            })
            .filter(tag => tag !== null) // Remove any invalid tags
            .flat(); // Flatten in case validateTags returned arrays
    }
    
    getActiveTagsHTML() {
        if (this.projectTags.length === 0) {
            return '<p class="no-tags">No tags added yet</p>';
        }
        
        // All tags should already be validated, but double-check
        const validTags = this.projectTags.filter(tag => 
            tag && typeof tag === 'object' && tag.icon && tag.label
        );
        
        if (validTags.length === 0) {
            return '<p class="no-tags">No tags added yet</p>';
        }
        
        return validTags.map((tag, index) => `
            <div class="project-tag">
                <i class="fas ${tag.icon || 'fa-tree'}"></i>
                <span>${tag.label || 'Unknown'}</span>
                <button type="button" class="remove-tag-btn" 
                        onclick="adminProjects.removeTag(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    toggleIconPicker() {
        const dropdown = document.getElementById('iconPickerDropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }
    
    selectIcon(iconClass) {
        this.selectedIcon = iconClass;
        const btn = document.getElementById('selectedIconBtn');
        if (btn) {
            btn.innerHTML = `<i class="fas ${iconClass}"></i>`;
        }
        
        // Close dropdown
        const dropdown = document.getElementById('iconPickerDropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }
    
    addPredefinedTag(icon, label) {
        // Check if tag already exists
        if (this.projectTags.some(t => t.label === label)) {
            this.showError('Tag already added');
            return;
        }
        
        this.projectTags.push({ icon, label });
        this.updateActiveTags();
    }
    
    addCustomTag() {
        const input = document.getElementById('customTagInput');
        if (!input) return;
        
        const label = input.value.trim();
        
        if (!label) {
            this.showError('Please enter a tag name');
            return;
        }
        
        if (this.projectTags.some(t => t.label === label)) {
            this.showError('Tag already exists');
            return;
        }
        
        const icon = this.selectedIcon || 'fa-tree';
        this.projectTags.push({ icon, label });
        
        // Clear input and reset icon
        input.value = '';
        this.selectIcon('fa-tree');
        
        this.updateActiveTags();
    }
    
    removeTag(index) {
        this.projectTags.splice(index, 1);
        this.updateActiveTags();
    }
    
    updateActiveTags() {
        const container = document.getElementById('activeTags');
        if (container) {
            container.innerHTML = this.getActiveTagsHTML();
        }
    }
    
    handleImageUpload(files) {
        const maxFiles = 10;
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        // Count total images (existing + new + newly uploading)
        const existingCount = this.isEditing && this.currentProject 
            ? (this.currentProject.image_previews.length - this.deletedImageIndices.length)
            : 0;
        const currentTotal = existingCount + this.imageFiles.length;
        
        Array.from(files).forEach(file => {
            const totalAfterAdd = currentTotal + this.imageFiles.length;
            
            if (totalAfterAdd >= maxFiles) {
                this.showError(`Maximum ${maxFiles} images allowed`);
                return;
            }
            
            if (file.size > maxSize) {
                this.showError(`Image ${file.name} is too large. Maximum size is 10MB`);
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                this.showError(`File ${file.name} is not an image`);
                return;
            }
            
            this.imageFiles.push(file);
        });
        
        // Clear the file input so the same files can be re-selected if needed
        const fileInput = document.getElementById('imageInput');
        if (fileInput) {
            fileInput.value = '';
        }
        
        this.updateImagePreviews();
    }
    
    removeExistingImage(index) {
        if (this.currentProject && this.currentProject.image_previews) {
            // Mark this image index for deletion instead of removing it immediately
            if (!this.deletedImageIndices.includes(index)) {
                this.deletedImageIndices.push(index);
            }
            this.updateImagePreviews();
        }
    }
    
    removeNewImage(index) {
        // Revoke the object URL to free memory
        const file = this.imageFiles[index];
        if (file && file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl);
        }
        
        this.imageFiles.splice(index, 1);
        this.updateImagePreviews();
    }
    
    updateImagePreviews() {
        const previewGrid = document.getElementById('imagePreviewGrid');
        if (previewGrid) {
            previewGrid.innerHTML = this.getImagePreviewsHTML();
            // Re-setup lazy loading for new images
            this.setupModalImageLazyLoading();
        }
    }
    
    setupModalImageLazyLoading() {
        // Create observer for modal images if it doesn't exist
        if (!this.modalImagesObserver) {
            this.modalImagesObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.getAttribute('data-src');
                        if (src) {
                            img.src = src;
                            img.classList.remove('lazy-load');
                            img.classList.add('loaded');
                        }
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '100px' // Load earlier for modal images
            });
        }
        
        // Observe all images in the modal with data-src attribute
        const modalImages = document.querySelectorAll('#imagePreviewGrid .image-preview-item img[data-src]');
        modalImages.forEach(img => {
            this.modalImagesObserver.observe(img);
        });
    }
    
    async handleFormSubmit(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn.innerHTML;
        
        try {
            // Disable all modal buttons and show loading state
            this.setFormLoadingState(true);
            
            const formData = new FormData(form);
            
            // Add image files
            this.imageFiles.forEach(file => {
                formData.append('images', file);
            });
            
            // Use the toggle selected status
            formData.append('published', this.publishedStatus);
            
            // Add tags as JSON string - clean up any invalid tags first
            const validTags = this.projectTags
                .filter(tag => 
                    tag && typeof tag === 'object' && tag.icon && tag.label
                )
                .map(tag => ({
                    icon: tag.icon,
                    label: tag.label
                })); // Create clean objects to prevent any corruption
            
            formData.append('tags', JSON.stringify(validTags));
            
            // Add keep existing images flag for editing
            if (this.isEditing) {
                formData.append('keep_existing_images', 'true');
                // Add deleted image indices
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
            
            this.showSuccess(result.message || 'Project saved successfully');
            this.closeModal();
            this.loadProjects();
            
        } catch (error) {
            console.error('Error saving project:', error);
            this.showError(error.message || 'Failed to save project');
            // Re-enable form on error
            this.setFormLoadingState(false);
        }
    }
    
    setFormLoadingState(isLoading) {
        const modal = document.getElementById('projectModal');
        if (!modal) return;
        
        const submitBtn = modal.querySelector('button[type="submit"]');
        const allButtons = modal.querySelectorAll('button');
        
        if (isLoading) {
            // Store original content
            if (submitBtn) {
                submitBtn.dataset.originalContent = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                submitBtn.disabled = true;
            }
            // Disable all other buttons
            allButtons.forEach(btn => {
                if (btn !== submitBtn) {
                    btn.disabled = true;
                }
            });
        } else {
            // Restore original content
            if (submitBtn && submitBtn.dataset.originalContent) {
                submitBtn.innerHTML = submitBtn.dataset.originalContent;
                submitBtn.disabled = false;
            }
            // Re-enable all buttons
            allButtons.forEach(btn => {
                btn.disabled = false;
            });
        }
    }
    
    async handleDeleteProject(projectId) {
        const project = this.projects.find(p => p.project_id === projectId);
        
        if (!project) {
            this.showError('Project not found');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
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
            
            // Clear the deleted project from cache
            this.projectsCache.delete(projectId);
            
            this.showSuccess(result.message || 'Project deleted successfully');
            this.closeModal(); // Close modal after successful deletion
            this.loadProjects();
            
        } catch (error) {
            console.error('Error deleting project:', error);
            this.showError(error.message || 'Failed to delete project');
        }
    }
    
    async togglePublished(projectId) {
        try {
            const response = await fetch(`/api/projects/${projectId}/toggle-published`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to toggle published status');
            }
            
            const result = await response.json();
            this.showSuccess(result.message);
            this.loadProjects();
            
        } catch (error) {
            console.error('Error toggling published status:', error);
            this.showError(error.message || 'Failed to toggle published status');
        }
    }
    
    
    initDragAndDrop() {
        const gridContainer = document.getElementById('projectsGrid');
        if (!gridContainer) return;
        
        const projectCards = gridContainer.querySelectorAll('.project-card');
        
        // Use event delegation to avoid re-attaching listeners
        if (!gridContainer.dataset.dragInitialized) {
            gridContainer.dataset.dragInitialized = 'true';
            
            // Delegate dragstart to cards
            gridContainer.addEventListener('dragstart', (e) => {
                const card = e.target.closest('.project-card');
                if (!card) return;
                
                this.draggedElement = card;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', '');
                
                requestAnimationFrame(() => {
                    card.style.opacity = '0.3';
                });
            }, true);
            
            // Delegate dragend to cards
            gridContainer.addEventListener('dragend', (e) => {
                const card = e.target.closest('.project-card');
                if (!card) return;
                
                card.classList.remove('dragging');
                card.style.opacity = '1';
                this.draggedElement = null;
            }, true);
            
            // Delegated mousedown for drag handle
            gridContainer.addEventListener('mousedown', (e) => {
                if (e.target.closest('.drag-handle')) {
                    const card = e.target.closest('.project-card');
                    if (card) {
                        card.style.cursor = 'grabbing';
                        const handleMouseUp = () => {
                            card.style.cursor = '';
                            document.removeEventListener('mouseup', handleMouseUp);
                        };
                        document.addEventListener('mouseup', handleMouseUp, { once: true });
                    }
                }
            }, true);
            
            // Improved dragover handling on container
            gridContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                if (!this.draggedElement) return;
                
                const afterElement = this.getDragAfterElement(gridContainer, e.clientY);
                
                // Avoid unnecessary DOM manipulations
                if (afterElement == null) {
                    if (gridContainer.lastElementChild !== this.draggedElement) {
                        gridContainer.appendChild(this.draggedElement);
                    }
                } else {
                    if (this.draggedElement !== afterElement && this.draggedElement.nextSibling !== afterElement) {
                        gridContainer.insertBefore(this.draggedElement, afterElement);
                    }
                }
            }, { passive: false });
            
            gridContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (this.draggedElement) {
                    // Debounce order updates to reduce server requests
                    clearTimeout(this.orderUpdateTimeout);
                    this.orderUpdateTimeout = setTimeout(() => {
                        this.updateProjectOrder();
                    }, 300);
                }
            });
        }
        
        // Just set draggable attribute on cards
        projectCards.forEach(card => {
            card.setAttribute('draggable', 'true');
        });
    }
    
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.project-card:not(.dragging)')];
        
        // If no elements, return null
        if (draggableElements.length === 0) return null;
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            // Only consider elements above the cursor (offset < 0 means cursor is below element center)
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    async updateProjectOrder() {
        try {
            const projectCards = document.querySelectorAll('.project-card');
            const orderUpdates = [];
            
            projectCards.forEach((card, index) => {
                const projectId = card.dataset.projectId;
                orderUpdates.push({
                    projectId,
                    order: index
                });
            });
            
            // Update order for all projects
            const updatePromises = orderUpdates.map(({ projectId, order }) =>
                fetch(`/api/projects/${projectId}/reorder`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ order })
                })
            );
            
            await Promise.all(updatePromises);
            this.showSuccess('Project order updated successfully');
            
        } catch (error) {
            console.error('Error updating project order:', error);
            this.showError('Failed to update project order');
            this.loadProjects(); // Reload to reset order
        }
    }
    
    closeModal() {
        const modal = document.getElementById('projectModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        
        // Clean up all preview URLs to free memory
        this.imageFiles.forEach(file => {
            if (file.previewUrl) {
                URL.revokeObjectURL(file.previewUrl);
            }
        });
        
        // Unobserve modal images to free memory
        if (this.modalImagesObserver) {
            document.querySelectorAll('#imagePreviewGrid img[data-src]').forEach(img => {
                this.modalImagesObserver.unobserve(img);
            });
        }
        
        // Reset all state
        this.imageFiles = [];
        this.deletedImageIndices = [];
        this.projectTags = [];
        this.selectedIcon = 'fa-tree';
        this.currentProject = null;
        this.isEditing = false;
    }
    
    showLoading() {
        const projectsGrid = document.getElementById('projectsGrid');
        if (projectsGrid) {
            projectsGrid.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner"></i>
                    Loading projects...
                </div>
            `;
        }
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (typeof showNotification === 'function') {
            showNotification(message);
            return;
        }
        
        // Fallback notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminProjects = new AdminProjects();
});

// Export for global access
window.AdminProjects = AdminProjects;