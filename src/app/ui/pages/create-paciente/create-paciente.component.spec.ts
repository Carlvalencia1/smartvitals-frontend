import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePacienteComponent } from './create-paciente.component';

describe('CreatePacienteComponent', () => {
  let component: CreatePacienteComponent;
  let fixture: ComponentFixture<CreatePacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePacienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
