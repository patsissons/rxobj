import { Observable } from 'rxjs';
import * as rxo from '../../src/rxobj';

export interface SearchService {
  getResults(query: string): Observable<string[]>;
}

export class SearchViewModel extends rxo.ReactiveObject {
  public queryText: rxo.ReactiveProperty<this, string>;
  public search: rxo.ReactiveCommand<this, string, string[]>;
  public searchResults: rxo.ReactiveList<this, string>;

  constructor(private searchService: SearchService) {
    super();

    this.queryText = this.property('');
    this.searchResults = this.list<string>();

    const canSearch = this.queryText.changed
      .map(x => x.value)
      .map(x => x != null && x.trim().length > 0)
      .distinctUntilChanged()
      .startWith((this.queryText.value || '').length > 0);

    this.search = this.command((queryText: string) => this.searchService.getResults(queryText), canSearch);

    this.add(
      this.search.results
        .subscribe(x => {
          this.searchResults.reset(...x);
        })
    );

    this.search.thrownErrors
      .subscribe(this.thrownErrorsHandler.next);

    this
      .whenAnyValue(this, (x: this) => x.queryText, x => x)
      // .debounceTime(1000)
      .invokeCommand(this, (x: this) => x.search);
  }
}
