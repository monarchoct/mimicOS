// Companion Management Module
import { v4 as uuidv4 } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.1/+esm';

export class CompanionManager {
    constructor() {
        this.companions = [];
        this.activeCompanionId = null;
        this.onSelectCompanion = null;
    }
    
    async loadCompanions() {
        try {
            // Load from localStorage for now
            const saved = localStorage.getItem('companions');
            if (saved) {
                this.companions = JSON.parse(saved);
                this.renderCompanionList();
            }
            
            // In production, this would fetch from the server
            // const response = await fetch('/api/companions');
            // this.companions = await response.json();
        } catch (error) {
            console.error('Failed to load companions:', error);
        }
    }
    
    async createCompanion(data) {
        const companion = {
            id: uuidv4(),
            ...data,
            createdAt: new Date().toISOString(),
            stats: {
                messages: 0,
                voiceCalls: 0,
                lastActive: new Date().toISOString()
            }
        };
        
        this.companions.push(companion);
        this.saveCompanions();
        this.renderCompanionList();
        
        // In production, this would POST to the server
        // await fetch('/api/companions', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(companion)
        // });
        
        return companion;
    }
    
    updateCompanion(id, updates) {
        const index = this.companions.findIndex(c => c.id === id);
        if (index !== -1) {
            this.companions[index] = { ...this.companions[index], ...updates };
            this.saveCompanions();
            this.renderCompanionList();
        }
    }
    
    deleteCompanion(id) {
        this.companions = this.companions.filter(c => c.id !== id);
        this.saveCompanions();
        this.renderCompanionList();
        
        if (this.activeCompanionId === id) {
            this.activeCompanionId = null;
        }
    }
    
    saveCompanions() {
        localStorage.setItem('companions', JSON.stringify(this.companions));
    }
    
    renderCompanionList() {
        const container = document.getElementById('companion-list');
        container.innerHTML = '';
        
        if (this.companions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 15px;"></i>
                    <p style="color: var(--text-secondary);">No companions yet</p>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Create your first AI companion to get started!</p>
                </div>
            `;
            return;
        }
        
        this.companions.forEach(companion => {
            const card = this.createCompanionCard(companion);
            container.appendChild(card);
        });
    }
    
    createCompanionCard(companion) {
        const card = document.createElement('div');
        card.className = `companion-card ${companion.id === this.activeCompanionId ? 'active' : ''}`;
        card.dataset.companionId = companion.id;
        
        const avatarIcon = companion.avatarType === 'realistic' ? 'user' : 
                          companion.avatarType === 'anime' ? 'star' : 'smile';
        
        card.innerHTML = `
            <div class="companion-card-avatar avatar-${companion.avatarType}">
                <i class="fas fa-${avatarIcon}"></i>
            </div>
            <div class="companion-card-info">
                <div class="companion-card-name">${companion.name}</div>
                <div class="companion-card-personality">${this.getPersonalityLabel(companion.personality)}</div>
            </div>
            <div class="companion-card-status"></div>
            <div class="companion-actions">
                <button class="companion-actions-btn" data-action="menu">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="companion-actions-menu">
                    <div class="companion-action-item" data-action="edit">
                        <i class="fas fa-edit"></i>
                        <span>Edit</span>
                    </div>
                    <div class="companion-action-item" data-action="duplicate">
                        <i class="fas fa-copy"></i>
                        <span>Duplicate</span>
                    </div>
                    <div class="companion-action-item" data-action="export">
                        <i class="fas fa-download"></i>
                        <span>Export</span>
                    </div>
                    <div class="companion-action-item" data-action="delete" style="color: var(--error-color);">
                        <i class="fas fa-trash"></i>
                        <span>Delete</span>
                    </div>
                </div>
            </div>
        `;
        
        // Click to select companion
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.companion-actions')) {
                this.selectCompanion(companion.id);
            }
        });
        
        // Actions menu
        const actionsBtn = card.querySelector('[data-action="menu"]');
        const actionsMenu = card.querySelector('.companion-actions-menu');
        
        actionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            actionsMenu.classList.toggle('show');
            
            // Close other menus
            document.querySelectorAll('.companion-actions-menu').forEach(menu => {
                if (menu !== actionsMenu) {
                    menu.classList.remove('show');
                }
            });
        });
        
        // Action items
        card.querySelectorAll('.companion-action-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                this.handleCompanionAction(action, companion);
                actionsMenu.classList.remove('show');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', () => {
            actionsMenu.classList.remove('show');
        });
        
        return card;
    }
    
    getPersonalityLabel(personality) {
        const labels = {
            friendly: 'Friendly & Warm',
            professional: 'Professional',
            creative: 'Creative & Playful',
            wise: 'Wise & Thoughtful',
            energetic: 'Energetic'
        };
        
        return labels[personality] || personality;
    }
    
    selectCompanion(id) {
        const companion = this.companions.find(c => c.id === id);
        if (!companion) return;
        
        this.activeCompanionId = id;
        
        // Update UI
        document.querySelectorAll('.companion-card').forEach(card => {
            card.classList.toggle('active', card.dataset.companionId === id);
        });
        
        // Update stats
        companion.stats.lastActive = new Date().toISOString();
        this.saveCompanions();
        
        // Notify app
        if (this.onSelectCompanion) {
            this.onSelectCompanion(companion);
        }
    }
    
    setActiveCompanion(id) {
        this.activeCompanionId = id;
        document.querySelectorAll('.companion-card').forEach(card => {
            card.classList.toggle('active', card.dataset.companionId === id);
        });
    }
    
    handleCompanionAction(action, companion) {
        switch (action) {
            case 'edit':
                this.editCompanion(companion);
                break;
                
            case 'duplicate':
                this.duplicateCompanion(companion);
                break;
                
            case 'export':
                this.exportCompanion(companion);
                break;
                
            case 'delete':
                if (confirm(`Are you sure you want to delete ${companion.name}?`)) {
                    this.deleteCompanion(companion.id);
                }
                break;
        }
    }
    
    editCompanion(companion) {
        // TODO: Open edit modal
        console.log('Edit companion:', companion);
    }
    
    duplicateCompanion(companion) {
        const duplicate = {
            ...companion,
            id: uuidv4(),
            name: `${companion.name} (Copy)`,
            createdAt: new Date().toISOString(),
            stats: {
                messages: 0,
                voiceCalls: 0,
                lastActive: new Date().toISOString()
            }
        };
        
        this.companions.push(duplicate);
        this.saveCompanions();
        this.renderCompanionList();
    }
    
    exportCompanion(companion) {
        const data = JSON.stringify(companion, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${companion.name.toLowerCase().replace(/\s+/g, '-')}-companion.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    getCompanionById(id) {
        return this.companions.find(c => c.id === id);
    }
    
    updateCompanionStats(id, statUpdates) {
        const companion = this.getCompanionById(id);
        if (companion) {
            companion.stats = { ...companion.stats, ...statUpdates };
            this.saveCompanions();
        }
    }
}