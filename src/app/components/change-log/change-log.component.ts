import { Component } from '@angular/core';
import { changeLog } from 'src/app/model/change-log';

@Component({
  selector: 'app-change-log',
  templateUrl: './change-log.component.html',
  styleUrl: './change-log.component.scss',
  standalone: false,
})
export class ChangeLogComponent {
  changeLog = changeLog;
}
