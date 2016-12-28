import { Observable, Subject } from 'rxjs';

import { subscribeNotCalledError } from '../setup';
import { SearchService, SearchViewModel } from './Search';

describe('Search Example', () => {
  const svc = <SearchService>{
    getResults: function getResults(query: string) {
      return Observable
        .of([ 'A', 'B', 'C' ])
        .map(x => (query == null || query === '') ? x : x.filter(y => y === query));
    },
  };

  let vm: SearchViewModel;

  beforeEach(() => {
    vm = new SearchViewModel(svc);
  });

  it('generates queryText changed notifications when queryText changes', (done) => {
    const input = [ 'A', 'B', 'C' ];
    const stop = new Subject();
    let error = subscribeNotCalledError;

    vm
      .whenAnyValue(x => x.queryText, x => x)
      .takeUntil(stop)
      .filter(x => (x || '').length > 0)
      .toArray()
      .finally(() => done(error))
      .subscribe(x => {
        error = null;
        x.should.eql(input);
      });

    input.forEach(x => {
      vm.queryText.value = x;
    });

    stop.next();
  });

  it('generates view model changed notifications for queryText when queryText changes', (done) => {
    const input = [ 'A', 'B', 'C' ];
    const stop = new Subject();
    let error = subscribeNotCalledError;

    vm
      .whenAnyObservable(x => x.changed, x => x)
      .takeUntil(stop)
      .filter(x => x.value.name === 'queryText' && (x.value.value || '').length > 0)
      .map(x => <string>x.value.value)
      .toArray()
      .finally(() => done(error))
      .subscribe(x => {
        error = null;
        x.should.eql(input);
      });

    input.forEach(x => {
      vm.queryText.value = x;
    });

    stop.next(true);
  });

  it('generates search results notifications when queryText changes', (done) => {
    const input = [ 'A', 'B', 'C' ];
    const stop = new Subject();
    let error = subscribeNotCalledError;

    vm
      .whenAnyValue(x => x.search, x => x)
      .takeUntil(stop)
      .filter(x => (x || []).length > 0)
      .toArray()
      .finally(() => done(error))
      .subscribe(x => {
        error = null;
        x.should.eql(input.map(y => [ y ]));
      });

    input.forEach(x => {
      vm.queryText.value = x;
    });

    stop.next();
  });

  it('generates view model changed notifications for search results when queryText changes', (done) => {
    const input = [ 'A', 'B', 'C' ];
    const stop = new Subject();
    let error = subscribeNotCalledError;

    vm
      .whenAnyObservable(x => x.changed, x => x)
      .takeUntil(stop)
      .filter(x => x.value.name === 'search' && (x.value.value || []).length > 0)
      .map(x => <string>x.value.value)
      .toArray()
      .finally(() => done(error))
      .subscribe(x => {
        error = null;
        x.should.eql(input.map(y => [ y ]));
      });

    input.forEach(x => {
      vm.queryText.value = x;
    });

    stop.next(true);
  });

  it('generates searchResults notifications when queryText changes', (done) => {
    const input = [ 'A', 'B', 'C' ];
    const stop = new Subject();
    let error = subscribeNotCalledError;

    vm
      .whenAnyValue(x => x.searchResults, x => x)
      .takeUntil(stop)
      .filter(x => (x || []).length > 0)
      .toArray()
      .finally(() => done(error))
      .subscribe(x => {
        error = null;
        x.should.eql(input.map(y => [ y ]));
      });

    input.forEach(x => {
      vm.queryText.value = x;
    });

    stop.next();
  });

  it('generates view model changed notifications for searchResults when queryText changes', (done) => {
    const input = [ 'A', 'B', 'C' ];
    const stop = new Subject();
    let error = subscribeNotCalledError;

    vm
      .whenAnyObservable(x => x.changed, x => x)
      .takeUntil(stop)
      .filter(x => x.value.name === 'searchResults' && (x.value.value || []).length > 0)
      .map(x => <string>x.value.value)
      .toArray()
      .finally(() => done(error))
      .subscribe(x => {
        error = null;
        x.should.eql(input.map(y => [ y ]));
      });

    input.forEach(x => {
      vm.queryText.value = x;
    });

    stop.next(true);
  });
});
