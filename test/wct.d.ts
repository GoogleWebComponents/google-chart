// https://github.com/PolymerElements/test-fixture#even-simpler-usage-in-mocha
declare function fixture(tagName: string): HTMLElement;


// Minimal typings for sinon.
declare namespace sinon {
  function spy(obj: unknown, method: string): SinonSpy;
}

declare interface SinonSpy {
  called: boolean;
  calledOnce: boolean;
  restore(): void;
}
