Contributing to Chart.js v1x
========================

Contributions to Chart.js are welcome and encouraged, but please have a look through the guidelines in this document before raising an issue, or writing code for the project.


Using issues
------------

The [issue tracker](https://github.com/avlcodemonkey/Chart.js/issues) is the preferred channel for reporting bugs, requesting new features and submitting pull requests.

If you're suggesting a new chart type, please take a look at [writing new chart types](https://github.com/avlcodemonkey/Chart.js/blob/v1x/docs/07-Advanced.md#writing-new-chart-types) in the documentation, and some of the [community extensions](https://github.com/avlcodemonkey/Chart.js/blob/v1x/docs/07-Advanced.md#community-extensions) that have been created already.

To keep the library lightweight for everyone, it's unlikely we'll add many more chart types to the core of Chart.js, but issues are a good medium to design and spec out how new chart types could work and look.


Reporting bugs
--------------

Well structured, detailed bug reports are hugely valuable for the project.

Guidlines for reporting bugs:

 - Check the issue search to see if it has already been reported
 - Isolate the problem to a simple test case
 - Provide a demonstration of the problem on [JS Bin](http://jsbin.com) or similar

Please provide any additional details associated with the bug, if it's browser or screen density specific, or only happens with a certain configuration or data.


Pull requests
-------------

Clear, concise pull requests are excellent at continuing the project's community driven growth. But please review [these guidelines](https://github.com/blog/1943-how-to-write-the-perfect-pull-request) and the guidelines below before starting work on the project.

Be advised that **Chart.js 2x is a separate project**. Requests related to that version will be disregarded. Instead go to [Chart.js](https://github.com/chartjs/Chart.js).

Guidelines:

 - Please create an issue first:
   - For bugs, we can discuss the fixing approach.
   - For enhancements, we can discuss if it is within the project scope and avoid duplicate effort.
 - Please make changes to the files in [`/src`](https://github.com/avlcodemonkey/Chart.js/tree/v1x/src), not `Chart.js` or `Chart.min.js` in the repo root directory, this avoids merge conflicts.
 - Spaces for indentation, not tabs please.
 - If adding new functionality, please also update the relevant `.md` file in [`/docs`](https://github.com/avlcodemonkey/Chart.js/tree/v1x/docs).
 - Please make your commits in logical sections with clear commit messages.

License
-------

By contributing your code, you agree to license your contribution under the [MIT license](https://github.com/avlcodemonkey/Chart.js/blob/v1x/LICENSE.md).
