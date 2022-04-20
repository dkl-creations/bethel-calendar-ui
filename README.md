# bethel-calendar-ui


#Sample Calendar

```
var calConfig = {
    'token': "",
    autoload: true,
    canvas_id: "calendar",
    template_day: '<div class="w-layout-grid {day-class}" id="{id}"><div class="calendar-day-date-container"><div class="calendar-card-date">{day}</div><div class="calendar-card-date month">{month}</div></div><div class="calendar-day-contents"><h4 class="calendar-day-label">{weekday}</h4><div class="w-dyn-list"><div role="list" class="w-clearfix w-dyn-items {day-items-class}"></div></div></div></div>',
    template_item: '<div role="listitem" class="calendar-list-item w-clearfix w-dyn-item" categories="{categories}"><a href="{link}" class="calendar-link-block w-inline-block w-clearfix"><h5 class="calendar-item-title">{title}</h5></a><p class="calendar-item-details">{details}</p></div>'
};

Object.create(BethelCalendar).init(calConfig);
```


# Sample Datepicker

```
var multi = new Datepicker('#calendar-date-filter', {
    ranged: true,
    time: false,
    separator: " - ",
    fromValue: String => [BethelCalendar.dates.begin["unformatted"],BethelCalendar.dates.end["unformatted"]],
    min: (function(){
        var date = new Date();
        date.setDate(date.getDate() - 10);
        return date;
    })(),
    max: (function(){
        var date = new Date();
        date.setDate(date.getDate() + 185);
        return date;
    })(),
    onChange: function() {
    }
});
```