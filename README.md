JHFusion
========

JS &lt;-> HTML binding

# ATTRIBUTES:
-------------
## data-models
&lt;attr> &lt;&lt;>> &lt;scopedVarName> , &lt;other_attr> &lt;&lt;>> &lt;otherScopedVarName>, ... 

Examples:
value > myVar
value &lt; myVar
value &lt;> myVar
value &lt;&lt;> myVar
value &lt;>> myVar

title << savedTitleValue


## data-trigers
! or scopedVarName

!
myVar
myVar, savedTitleValue
!, myVar

## data-handler
scoped function name

## data-on***
data-onclick
data-onchange
data-onkeyup
data-on...


# Methods:
----------
bindOne(scope, htmlEl)
bindHTML(scope, topLevelHtmlEl, overwrite)
...


NOTE! require Object.observe (for now :)) 

