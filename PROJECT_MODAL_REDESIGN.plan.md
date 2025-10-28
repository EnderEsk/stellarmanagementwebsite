i # Project Modal Redesign with Tags System

## Overview
Restructure the project modal with a 3-column top row, predefined tags, custom tag creation with icon selection, description, and images.

## Current Structure (to be changed)
```
- Row 1: Title | Duration
- Description
- Location  
- Services (text input)
- Images
```

## New Structure
```
- Row 1 (3-column): Title | Duration | Location
- Predefined Tags (clickable rectangles with rounded edges)
- Custom Tag Creator:
  - Icon picker (15 icon options)
  - Tag text input
  - Add button
- Active Tags Display (removable)
- Description (textarea)
- Images upload
```

## Implementation Plan

### 1. Data Structure Changes

**Add to constructor:**
```javascript
this.projectTags = []; // Active tags for current project
this.availableIcons = [
    'fa-tree', 'fa-cut', 'fa-scissors', 'fa-leaf',
    'fa-seedling', 'fa-exclamation-triangle', 'fa-tools',
    'fa-broom', 'fa-wrench', 'fa-cog', 'fa-calendar-check',
    'fa-stethoscope', 'fa-fire', 'fa-snowflake', 'fa-wind'
];
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
```

### 2. Modal HTML Changes

**New `getModalHTML()` structure:**

```html
<form class="project-form">
    <div class="project-modal-body">
        <!-- 3-Column Row -->
        <div class="form-row-three-col">
            <div class="form-group">
                <label for="projectTitle">Project Title *</label>
                <input type="text" id="projectTitle" name="title" required>
            </div>
            <div class="form-group">
                <label for="projectDuration">Duration *</label>
                <input type="text" id="projectDuration" name="duration" required 
                       placeholder="e.g., 2 Hours">
            </div>
            <div class="form-group">
                <label for="projectLocation">Location *</label>
                <input type="text" id="projectLocation" name="location" required 
                       placeholder="e.g., Calgary NW">
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
                <input type="text" id="customTagInput" placeholder="Tag name..." 
                       maxlength="30">
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
                      placeholder="Describe the project details..." rows="6"></textarea>
        </div>
        
        <!-- Images -->
        <div class="form-group">
            <label>Project Images</label>
            <div class="image-upload-area" onclick="document.getElementById('imageInput').click()">
                <div class="image-upload-icon">
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <div class="image-upload-text">
                    Click to upload images or drag and drop
                </div>
                <div class="image-upload-hint">Supports JPG, PNG (max 10MB each)</div>
            </div>
            <input type="file" id="imageInput" name="images" multiple accept="image/*" style="display: none;">
            <div class="image-preview-grid" id="imagePreviewGrid">
                ${this.getImagePreviewsHTML()}
            </div>
        </div>
    </div>
    
    <!-- Hidden input to store tags as JSON -->
    <input type="hidden" name="tags" id="projectTagsInput">
    
    <div class="project-modal-actions">
        <!-- ... buttons -->
    </div>
</form>
```

### 3. New JavaScript Methods

```javascript
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

getActiveTagsHTML() {
    if (this.projectTags.length === 0) {
        return '<p class="no-tags">No tags added yet</p>';
    }
    
    return this.projectTags.map((tag, index) => `
        <div class="project-tag">
            <i class="fas ${tag.icon}"></i>
            <span>${tag.label}</span>
            <button type="button" class="remove-tag-btn" 
                    onclick="adminProjects.removeTag(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Toggle icon picker dropdown
toggleIconPicker() {
    const dropdown = document.getElementById('iconPickerDropdown');
    dropdown.classList.toggle('active');
}

// Select icon from picker
selectIcon(iconClass) {
    this.selectedIcon = iconClass;
    const btn = document.getElementById('selectedIconBtn');
    btn.innerHTML = `<i class="fas ${iconClass}"></i>`;
    
    // Close dropdown
    const dropdown = document.getElementById('iconPickerDropdown');
    dropdown.classList.remove('active');
}

// Add predefined tag
addPredefinedTag(icon, label) {
    // Check if tag already exists
    if (this.projectTags.some(t => t.label === label)) {
        this.showError('Tag already added');
        return;
    }
    
    this.projectTags.push({ icon, label });
    this.updateActiveTags();
}

// Add custom tag
addCustomTag() {
    const input = document.getElementById('customTagInput');
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

// Remove tag
removeTag(index) {
    this.projectTags.splice(index, 1);
    this.updateActiveTags();
}

// Update active tags display
updateActiveTags() {
    const container = document.getElementById('activeTags');
    if (container) {
        container.innerHTML = this.getActiveTagsHTML();
    }
}

// In setupEventListeners(), add:
document.addEventListener('click', (e) => {
    if (e.target.id === 'selectedIconBtn' || e.target.closest('#selectedIconBtn')) {
        this.toggleIconPicker();
    }
    
    if (e.target.id === 'addCustomTagBtn' || e.target.closest('#addCustomTagBtn')) {
        this.addCustomTag();
    }
    
    // Close icon picker when clicking outside
    if (!e.target.closest('.icon-picker')) {
        const dropdown = document.getElementById('iconPickerDropdown');
        if (dropdown) dropdown.classList.remove('active');
    }
});

// In handleFormSubmit(), add before submitting:
const tagsInput = document.getElementById('projectTagsInput');
if (tagsInput) {
    tagsInput.value = JSON.stringify(this.projectTags);
}

// In showEditModal(), load tags:
this.projectTags = this.currentProject?.tags ? JSON.parse(this.currentProject.tags) : [];

// In showCreateModal(), reset tags:
this.projectTags = [];

// In closeModal(), reset tags:
this.projectTags = [];
this.selectedIcon = 'fa-tree';
```

### 4. CSS Styles

**Add to `admin-projects.css`:**

```css
/* 3-Column Form Row */
.form-row-three-col {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

/* Predefined Tags */
.predefined-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.predefined-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.85rem;
}

.predefined-tag:hover {
    background: var(--admin-accent);
    color: white;
    border-color: var(--admin-accent);
}

.predefined-tag i {
    font-size: 0.9rem;
}

/* Custom Tag Creator */
.custom-tag-creator {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.icon-picker {
    position: relative;
}

.selected-icon-btn {
    width: 40px;
    height: 40px;
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: all 0.2s ease;
}

.selected-icon-btn:hover {
    background: var(--admin-light-gray);
}

.icon-picker-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 0.5rem;
    background: white;
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    padding: 0.5rem;
    display: none;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.25rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 1000;
    width: 200px;
}

.icon-picker-dropdown.active {
    display: grid;
}

.icon-option {
    width: 32px;
    height: 32px;
    border: 1px solid var(--admin-border);
    border-radius: 4px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.icon-option:hover {
    background: var(--admin-accent);
    color: white;
    border-color: var(--admin-accent);
}

#customTagInput {
    flex: 1;
    padding: 0.6rem;
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    font-size: 0.9rem;
}

.add-tag-btn {
    padding: 0.6rem 1rem;
    background: var(--admin-accent);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.add-tag-btn:hover {
    background: #7ab33a;
}

/* Active Tags */
.active-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    min-height: 40px;
    padding: 0.75rem;
    border: 1px dashed var(--admin-border);
    border-radius: 8px;
    background: var(--admin-light-gray);
}

.no-tags {
    color: var(--admin-secondary);
    font-size: 0.85rem;
    margin: 0;
}

.project-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.6rem;
    background: white;
    border: 1px solid var(--admin-border);
    border-radius: 8px;
    font-size: 0.85rem;
}

.project-tag i {
    color: var(--admin-accent);
}

.remove-tag-btn {
    background: none;
    border: none;
    color: #dc3545;
    cursor: pointer;
    padding: 0;
    margin-left: 0.25rem;
    font-size: 0.8rem;
    transition: color 0.2s ease;
}

.remove-tag-btn:hover {
    color: #c82333;
}

@media (max-width: 768px) {
    .form-row-three-col {
        grid-template-columns: 1fr;
    }
    
    .custom-tag-creator {
        flex-wrap: wrap;
    }
}
```

### 5. Server-side Changes

**Update `server.js` project endpoints to handle tags:**

```javascript
// In POST /api/projects
const projectDoc = {
    // ... existing fields
    tags: req.body.tags || '[]', // Store as JSON string
    // ... rest
};

// In PUT /api/projects/:projectId
const updateDoc = {
    // ... existing fields
    tags: req.body.tags || project.tags || '[]',
    // ... rest
};
```

## Expected Result

**Modal Layout:**
```
┌─────────────────────────────────────┐
│ [Title____] [Duration] [Location]  │ 3-column row
├─────────────────────────────────────┤
│ Quick Tags:                         │
│ [🌲 Tree] [✂️ Pruning] [🔧 Tools]  │ Clickable predefined tags
├─────────────────────────────────────┤
│ Create Custom Tag:                  │
│ [🌲▾] [Text Input____] [+ Add]     │ Icon picker + input + button
├─────────────────────────────────────┤
│ Project Tags:                       │
│ [🌲 Tree ×] [✂️ Pruning ×]         │ Active, removable tags
├─────────────────────────────────────┤
│ Description:                        │
│ [Text area_________________]        │
├─────────────────────────────────────┤
│ Images: [Upload area]               │
└─────────────────────────────────────┘
```

## To-do List

- [ ] Add tag-related properties to constructor
- [ ] Create 3-column form row layout
- [ ] Build predefined tags HTML
- [ ] Build icon picker dropdown
- [ ] Build custom tag creator
- [ ] Build active tags display
- [ ] Add tag event listeners
- [ ] Implement addPredefinedTag()
- [ ] Implement addCustomTag()
- [ ] Implement removeTag()
- [ ] Implement icon picker toggle/select
- [ ] Update handleFormSubmit() to include tags
- [ ] Update showEditModal() to load tags
- [ ] Update showCreateModal()/closeModal() to reset tags
- [ ] Add CSS for all tag components
- [ ] Update server to handle tags field

