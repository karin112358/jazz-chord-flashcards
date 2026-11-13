import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { changeLog } from 'src/app/model/change-log';

@Component({
  selector: 'app-change-log',
  imports: [DatePipe],
  templateUrl: './change-log.component.html',
  styleUrl: './change-log.component.scss',
})
export class ChangeLogComponent {
  changeLog = changeLog;
}
