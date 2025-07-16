// js/TabsController.js
export default class TabsController {
    constructor(selector, onTabChange) {
      this.buttons = Array.from(document.querySelectorAll(selector));
      this.onTabChange = onTabChange;
      this._bind();
    }
  
    _bind() {
      this.buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const tag = btn.dataset.tag;
          this._activate(btn);
          this.onTabChange(tag);
        });
      });
    }
  
    _activate(activeBtn) {
        this.buttons.forEach(btn => {
          const isActive = btn === activeBtn;
          // toggle each class individually:
          btn.classList.toggle('text-[#eb8934]', isActive);
          btn.classList.toggle('border-[#eb8934]', isActive);
        });
      }
    
  }
  