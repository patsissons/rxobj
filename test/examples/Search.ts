import { Observable } from 'rxjs';

import { ReactiveObject, ReactiveProperty, ReactiveCommand, ReactiveList } from '../../src/rxobj';

export interface SearchService {
  getResults(query: string): Observable<string[]>;
}

export class SearchViewModel extends ReactiveObject {
  public queryText: ReactiveProperty<this, string>;
  public search: ReactiveCommand<this, string, string[]>;
  public searchResults: ReactiveList<this, string>;

  constructor(private searchService: SearchService) {
    super();

    this.queryText = this.property('');
    this.searchResults = this.list<string>();

    const canSearch = this
      .whenAnyValue(x => x.queryText, x => x != null && x.trim().length > 0)
      .distinctUntilChanged();

    this.search = this
      .command((queryText: string) => {
        return this.searchService.getResults(queryText);
      }, canSearch);

    this.add(
      this.search.results
        .subscribe(x => {
          this.searchResults.reset(...x);
        })
    );

    this
      .whenAnyObservable(x => x.search.thrownErrors, x => x)
      .subscribe(this.thrownErrorsHandler.next);

    this
      .whenAnyValue(x => x.queryText, x => x)
      .filter(x => (x || '').length > 0)
      // .debounceTime(1000)
      .invokeCommand(this, x => x.search);
  }
}
