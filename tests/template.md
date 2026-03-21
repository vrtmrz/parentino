# ((= title))

Author: ((= author.name)) / ((upper ((= author.role))))

## Status

((define label ((if ((eq status "done")) "Complete" "In Progress")))) Status:
((= label))

Score is zero: ((if ((eq score "0")) "yes" "no")) Status is NOT done: ((not ((eq
status "done"))))

## Tags

((each tag tags ((concat "- " ((= tag)) " "))))

## Items (capture)

((capture itemTmpl))

- ((= item.name)): ((if item.done "✅" "⬜")) ((end)) ((each item items
  itemTmpl))

## Items (quote)

((define itemTmpl2 ((quote

- ((= item.name)): ((if item.done "✅" "⬜")) )))) ((each item items itemTmpl2))

## Concat

((concat "Hello" ", " ((= author.name)) "!"))

## Escape

'((= title)) — this is a literal tag, not expanded.

## With

((with author)) Name: ((= name)) Role: ((= role)) ((end))
