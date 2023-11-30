# What should you actually test?

- classes?
- functions?
- attributes?
- services?
- components?
- ...?

{{Notes}}
The fist thing to understand is what are we actually testing in unit tests
What do you think, which of these do we test?
As always, the answer is: (next slide)

---

## What do you actually test?

### Behavior

(Acceptance criteria)

{{Notes}}
This is a clear must do and it should not be open to debate.

---

![Confused Meme](img/confused-meme.jpg)
<!-- .element: style="background: white"-->

---
<!-- .element: data-auto-animate -->
## How to test behavior?

---

<!-- .element: data-auto-animate -->
## How to test behavior?

1. ensure that the system is in the correct state (Given)

---

<!-- .element: data-auto-animate -->
## How to test behavior?

1. ensure that the system is in the correct state (Given)
2. execute some action (When)

---

<!-- .element: data-auto-animate -->
## How to test behavior?

1. ensure that the system is in the correct state (Given)
2. execute some action (When)
3. expect that the system changed according to the behavior (Then)

---

<!-- .element: data-auto-animate -->
## How to test behavior?

1. ensure that the system is in the correct state (Given)
2. execute some action (When)
3. expect that the system changed according to the behavior (Then)

> Calling a **public** function or object method

---

## Example -> Router

```typescript [2,8-13|15-22|16-17,22|29-35|40-42|44-51|53-61]
export class Router {
  private _currentRoute: Route;
  public get currentRoute() {
    return this._currentRoute;
  }

  constructor(private routes: Route[]) {
    if (routes.length === 0) {
      throw new Error("Business Error, Router cannot function without routes.");
    }
    this._currentRoute = this.getDefaultRoute();
  }

  public handleUrlChange(url: string) {
    const route = this.findRoute(this.routes, url)
      ?? this.getDefaultRoute();
    if (route === this._currentRoute) {
      return;
    }
    this._currentRoute = route;
    this.updateShownPage(route);
  }

  private getDefaultRoute(): Route {
    return this.routes[0];
  }

  private findRoute(routes: Route[], url: string): Route | undefined {
    const possibleMatches = this.findMatches(routes, url);
    if (possibleMatches.length === 0) {
      return undefined;
    }
    return this.findBestMatch(possibleMatches);
  }
}

// src/router.spec.ts
describe("Router", () => {
  it("should fail fast, when no routes are provided", () => {
    expect(() => new Router([])).to.throw();
  });

  it("should change route", () => {
    const routes = [{ path: "/user" }, { path: "/profile" }];
    const router = new Router(routes);

    router.handleUrlChange("/profile");

    expect(router.currentRoute).to.equal({ path: "/profile" });
  });

  it("should not change current route, if it is the same route", () => {
    const routes = [{ path: "/user" }, { path: "/profile" }];
    const router = new Router(routes);
    const currentRoute = router.currentRoute;

    router.handleUrlChange("/user");

    expect(router.currentRoute).to.equal(currentRoute);
  });
});
```
