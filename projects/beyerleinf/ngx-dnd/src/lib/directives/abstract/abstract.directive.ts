import { ChangeDetectorRef, ElementRef, Input, ViewRef } from '@angular/core';

import { DragDropConfig } from '../../config/drag-drop-config';
import { DragImage } from '../../config/drag-image';
import { DragDropService } from '../../service/drag-drop/drag-drop.service';
import { isPresent } from '../../util';

export abstract class AbstractDirective {
  element: HTMLElement;
  private _dragHandle: HTMLElement;
  dragHelper: HTMLElement;
  defaultCursor: string;

  target: EventTarget;

  private _dragEnabled: boolean = true;

  @Input() dropEnabled: boolean = false;

  @Input() effectAllowed: string;

  @Input() effectCursor: string;

  @Input() dropZones: string[] = [];

  @Input() allowDrop: (dropData: any) => boolean;

  @Input() dragImage: string | DragImage | Function;

  @Input() cloneItem: boolean = false;

  constructor(
    elementReference: ElementRef,
    public dragDropService: DragDropService,
    public config: DragDropConfig,
    private cdr: ChangeDetectorRef
  ) {
    this.defaultCursor = this.config.defaultCursor;
    this.element = elementReference.nativeElement;
    this.element.style.cursor = this.defaultCursor;

    // Register drop events
    this.element.ondragenter = (event: Event) => this.dragEnter(event);
    this.element.ondragleave = (event: Event) => this.dragLeave(event);
    this.element.ondrop = (event: Event) => this.drop(event);

    this.element.ondragover = (event: DragEvent) => {
      this.dragOver(event);

      if (isPresent(event.dataTransfer)) {
        event.dataTransfer.dropEffect = this.config.dropEffect.name;
        event.dataTransfer.setData('text', '');
      }

      return false;
    };

    // Register drag events
    this.element.onmousedown = (event: MouseEvent) => {
      this.target = event.target;
    };

    this.element.ondragstart = (event: DragEvent) => {
      if (isPresent(this.dragHandle)) {
        if (!this.dragHandle.contains(this.target as Element)) {
          event.preventDefault();
          return;
        }
      }

      this.dragStart(event);

      if (isPresent(event.dataTransfer)) {
        // Required so that this whole thing works in Firefox at all
        event.dataTransfer.setData('text', '');
      }
    };

    this.element.ondragend = (event: Event) => {
      if (this.element.parentElement && this.dragHelper) {
        this.element.parentElement.removeChild(this.dragHelper);
      }
      // console.log('ondragend', event.target);
      this.dragEnd(event);
      // Restore style of dragged element
      const cursorElem = this._dragHandle ? this._dragHandle : this.element;
      cursorElem.style.cursor = this.defaultCursor;
    };
  }

  get dragEnabled(): boolean {
    return this._dragEnabled;
  }

  @Input()
  set dragEnabled(value: boolean) {
    this._dragEnabled = value;
    this.element.draggable = value;
  }

  get dragHandle(): HTMLElement {
    return this._dragHandle;
  }

  set dragHandle(value: HTMLElement) {
    this._dragHandle = value;
  }

  /**
   * Run change detection manually to fix an issue in Safari.
   *
   * @memberof AbstractDirective
   */
  detectChanges() {
    setTimeout(() => {
      if (this.cdr && !(this.cdr as ViewRef).destroyed) {
        this.cdr.detectChanges();
      }
    }, 250);
  }

  private dragEnter(event: Event): void {
    if (this.isDropAllowed(event)) {
      this.dragEnterCallback(event);
    }
  }

  private dragOver(event: Event): void {
    if (this.isDropAllowed(event)) {
      if (isPresent(event.preventDefault)) {
        event.preventDefault();
      }

      this.dragOverCallback(event);
    }
  }

  private dragLeave(event: Event): void {
    if (this.isDropAllowed(event)) {
      this.dragLeaveCallback(event);
    }
  }

  private drop(event: Event): void {
    if (this.isDropAllowed(event)) {
      this.preventAndStop(event);

      this.dropCallback(event);
      this.detectChanges();
    }
  }

  private dragStart(event: Event): void {
    if (this.dragEnabled) {
      this.dragDropService.allowedDropZones = this.dropZones;
      this.dragStartCallback(event);
    }
  }

  private dragEnd(event: Event): void {
    this.dragDropService.allowedDropZones = [];
    this.dragEndCallback(event);
  }

  private isDropAllowed(event: any): boolean {
    if (
      (this.dragDropService.isDragged ||
        (event.dataTransfer && event.dataTransfer.files)) &&
      this.dropEnabled
    ) {
      if (isPresent(this.allowDrop)) {
        return this.allowDrop(this.dragDropService.dragData);
      }

      if (
        this.dropZones.length === 0 &&
        this.dragDropService.allowedDropZones.length === 0
      ) {
        return true;
      }

      for (const dropZone of this.dragDropService.allowedDropZones) {
        if (this.dropZones.indexOf(dropZone) !== -1) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Prevent the given events default action from being called and stops it from being propagated further.
   *
   * @memberof AbstractDirective
   */
  private preventAndStop(event: Event): void {
    if (event.preventDefault) {
      event.preventDefault();
    }

    if (event.stopPropagation) {
      event.stopPropagation();
    }
  }

  dragEnterCallback(event: Event): void {
    /* noop */
  }

  dragOverCallback(event: Event): void {
    /* noop */
  }

  dragLeaveCallback(event: Event): void {
    /* noop */
  }

  dropCallback(event: Event): void {
    /* noop */
  }

  dragStartCallback(event: Event): void {
    /* noop */
  }

  dragEndCallback(event: Event): void {
    /* noop */
  }
}
