import { should } from '../setup';
import { Observable, BehaviorSubject } from 'rxjs';
import { SearchService, SearchViewModel } from './Search';

describe('Search Example', () => {
  function getResults(query: string) {
    return Observable
      .of([ 'A', 'B', 'C' ])
      .map(x => (query == null || query === '') ? x : x.filter(y => y === query));
  }

  const svc = <SearchService>{
    getResults,
  };

  const vm = new SearchViewModel(svc);

  const errors = new BehaviorSubject<Error>(undefined);
  const items = new BehaviorSubject<string[]>(undefined);
  let searchCount = 0;

  vm.thrownErrors.subscribe(errors);
  vm
    .whenAnyState(vm, x => x.searchResults, x => x.value)
    .subscribe(items);

  vm.search.results
    .subscribe(() => ++searchCount);

  it('functions as expected', () => {
    vm.queryText.value = 'B';
    should.exist(items.value);
    items.value.should.eql([ 'B' ]);
    searchCount.should.eql(1);

    vm.unsubscribe();
    vm.closed.should.be.true;
    vm.members.every(x => x.closed).should.be.true;
  });
});
