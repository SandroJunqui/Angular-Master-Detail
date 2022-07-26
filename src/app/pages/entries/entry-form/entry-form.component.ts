import { EntryService } from './../shared/entry.service';
import { EntryModel } from './../shared/entryModel';
import { AfterContentChecked, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-entry-form',
  templateUrl: './entry-form.component.html',
  styleUrls: ['./entry-form.component.css'],
})
export class EntryFormComponent implements OnInit, AfterContentChecked {
  currentAction: string | undefined; // se esta editando ou criando nova categoria
  entryForm = {} as FormGroup;
  pageTitle: string | undefined;
  serverErrorMessages: string[] | undefined;
  submittingForm: boolean = false;
  entry = {} as EntryModel;

  constructor(
    private entryService: EntryService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.setCurrentAction();
    this.buildEntryForm();
    this.loadEntry();
  }

  ngAfterContentChecked(): void {
    this.setPageTitle();
  }

  submitForm() {
    this.submittingForm = true;

    if (this.currentAction == 'new') this.createEntry();
    else this.updateEntry();
  }

  //  PRIVATE METHODS

  private setCurrentAction() {
    if (this.route.snapshot.url[0].path == 'new') this.currentAction = 'new';
    else this.currentAction = 'edit';
  }

  private buildEntryForm() {
    this.entryForm = this.formBuilder.group({
      id: [null],
      name: [null, [Validators.required, Validators.minLength(2)]],
      description: [null],
      type: [null, [Validators.required]],
      amount: [null, [Validators.required]],
      date: [null, [Validators.required]],
      paid: [null, [Validators.required]],
      categoryId: [null, [Validators.required]],
    });
  }

  private loadEntry() {
    if (this.currentAction == 'edit') {
      this.route.paramMap
        .pipe(
          switchMap((params) =>
            this.entryService.getById(+params.get('id')!)
          )
        )
        .subscribe(
          (entry) => {
            this.entry = entry;
            this.entryForm.patchValue(entry); // binds loaded entry data to categories
          },
          (error) => alert('ocorreu um erro no servidor, tente mais tarde.')
        );
    }
  }

  private setPageTitle() {
    if (this.currentAction == 'new')
      this.pageTitle = 'Cadastro de Novo Lançamento';
    else {
      const entryName = this.entry.name || '';
      this.pageTitle = 'Editando Lançamento: ' + entryName;
    }
  }

  private createEntry() {
    const entry: EntryModel = Object.assign(
      new EntryModel(),
      this.entryForm.value
    );

    this.entryService.create(entry).subscribe(
      (entry) => this.actionsForSuccess(entry),
      (error) => this.actionsForError(error)
    );
  }

  private updateEntry() {
    const entry: EntryModel = Object.assign(
      new EntryModel(),
      this.entryForm.value
    );

    this.entryService.update(entry).subscribe(
      (entry) => this.actionsForSuccess(entry),
      (error) => this.actionsForError(error)
    );
  }

  private actionsForSuccess(entry: EntryModel) {
    /*     toastr.success('Solicitação processada com sucesso!'); */

    // redirect/reload component page
    this.router
      .navigateByUrl('entries', { skipLocationChange: true })
      .then(() => this.router.navigate(['categories', entry.id, 'edit']));
  }

  private actionsForError(error: { status: number; _body: string }) {
    /*     toastr.error('ocorreu um erro ao processar a sua solicitação!'); */

    this.submittingForm = false;

    if (error.status === 422)
      this.serverErrorMessages = JSON.parse(error._body).errors;
    else
      this.serverErrorMessages = [
        'Falha na comunicação com o servidor. Por favor, tente mais tarde.',
      ];
  }
}
