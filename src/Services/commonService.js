export class commonService {
  constructor() {
    //Add class to element
    function AddClass(item, className) {
      var myElement = document.querySelector(item);
      myElement.classList.add(className);
    }

    //Remove class from element
    function RemoveClass(item, className) {
      var myElement = document.querySelector(item);
      myElement.classList.remove(className);
    }
  }
}
