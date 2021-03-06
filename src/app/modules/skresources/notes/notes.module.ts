import { NgModule, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NoteDialog } from './note-dialog';
import { RegionDialog } from './region-dialog';
// ** pipes **
import { AddTargetPipe } from './safe.pipe';

import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

@NgModule({
    imports: [
        CommonModule, FormsModule, MatDialogModule,
        MatCheckboxModule, MatCardModule, MatListModule,
        MatButtonModule, MatIconModule, MatTooltipModule, 
        MatSliderModule, MatSlideToggleModule, 
        MatFormFieldModule, MatInputModule,
        CKEditorModule
    ],
    declarations: [
        NoteDialog, RegionDialog, AddTargetPipe
    ],
    exports: [
        NoteDialog, RegionDialog, AddTargetPipe
    ],
    entryComponents: [
        NoteDialog, RegionDialog
    ]
})
export class SKNotesModule { }

export * from './note-dialog';
export * from './region-dialog';
