// Namespace
const MAP_NAMESPACE = {
  STR_ACTIVE: "active",
  STR_VALUE: "value",
  STR_SELECTED: "selected",
  STR_TRUE: "1",
  STR_FALSE: "0",
  STR_HIDDEN: "hidden",
  STR_VISIBLE: "visible",
  BOOL_TRUE: true,
  BOOL_FALSE: false,
  CLASS_SEARCHABLE_WRAPPER: ".dd-searchable-wrapper",
  CLASS_SEARCHABLE_MENU: ".dd-searchable-wrapper .dd-searchable-menu",
  CLASS_SELECT_FIELD: ".dd-searchable-wrapper .select-field-container",
  CLASS_INPUT: ".dd-searchable-wrapper .select-field-value",
  CLASS_MENU_LIST: ".dd-searchable-wrapper .menu-list-container",
  CLASS_MENU_LIST_ITEM: ".dd-searchable-wrapper .menu-list-container .menu-list-item",
  CLASS_ERROR_STATUS: ".dd-searchable-wrapper .error-status",
  CLASS_LOCATION_ITEM: ".dd-searchable-wrapper .location-item",
  CLASS_REGION: ".dd-searchable-wrapper .region",
  EVENT_CLICK: "click",
  EVENT_INPUT: "input",
};

const $ = (node, query) => {
  const nodeList = node.querySelectorAll(query);

  if (nodeList.length > 1) {
    return nodeList;
  } else if (nodeList.length === 1) {
    return nodeList[0];
  } else {
    return null;
  }
};

// State
const store = {
  timeout: undefined,
  delay: 200,
  searchable: {
    state: {
      searchedKeyword: "",
      isDropdownActive: false,
      selectionList: [],
      searchableWrapperNode: $(document, MAP_NAMESPACE.CLASS_SEARCHABLE_WRAPPER),
      orignalListOfLocations: $(document, MAP_NAMESPACE.CLASS_MENU_LIST_ITEM),
      menuListContainer: $(document, MAP_NAMESPACE.CLASS_MENU_LIST),
      errorStatusNode: $(document, MAP_NAMESPACE.CLASS_ERROR_STATUS),
    },
    setState: (updateStore, render, handleSideEffect) => {
      if (updateStore !== undefined) updateStore();
      if (render !== undefined) render();
      if (handleSideEffect !== undefined) handleSideEffect();
      return;
    },
  },
};

const shouldRegionBeChecked = node => {
  return [...node.parentElement.children].every(node => {
    const isSelected = node.getAttribute(MAP_NAMESPACE.STR_SELECTED);
    return isSelected === MAP_NAMESPACE.STR_TRUE;
  });
};

const applyCheckBox = node => {
  node[0].classList.remove(MAP_NAMESPACE.STR_VISIBLE);
  node[0].classList.add(MAP_NAMESPACE.STR_HIDDEN);
  node[1].classList.remove(MAP_NAMESPACE.STR_HIDDEN);
  node[1].classList.add(MAP_NAMESPACE.STR_VISIBLE);
};

const removeCheckBox = node => {
  node[0].classList.remove(MAP_NAMESPACE.STR_HIDDEN);
  node[0].classList.add(MAP_NAMESPACE.STR_VISIBLE);
  node[1].classList.remove(MAP_NAMESPACE.STR_VISIBLE);
  node[1].classList.add(MAP_NAMESPACE.STR_HIDDEN);
};

const debounce = (callback, delay) => {
  clearTimeout(store.timeout);

  store.timeout = setTimeout(() => {
    callback();
  }, delay);
};

const populateOptions = () => {
  store.searchable.state.menuListContainer.innerHTML = `
    ${[...store.searchable.state.orignalListOfLocations].map(node => node.outerHTML).join("")}
    `;

  return;
};

const renderFilterResultInDOM = (filteredArray, searchableMenuNode) => {
  store.searchable.state.menuListContainer.innerHTML = "";

  if (filteredArray.length === 0 && store.searchable.state.searchedKeyword.length !== 0) {
    store.searchable.setState(
      () => {
        store.searchable.state.isDropdownActive = MAP_NAMESPACE.BOOL_FALSE;
      },
      () => {
        searchableMenuNode.classList.remove(MAP_NAMESPACE.STR_ACTIVE);
        store.searchable.state.errorStatusNode.classList.add(MAP_NAMESPACE.STR_ACTIVE);
        populateOptions();
      }
    );
  } else if (filteredArray.length !== 0 && store.searchable.state.searchedKeyword.length === 0) {
    store.searchable.setState(
      () => {
        store.searchable.state.isDropdownActive = MAP_NAMESPACE.BOOL_TRUE;
      },
      () => {
        store.searchable.state.errorStatusNode.classList.remove(MAP_NAMESPACE.STR_ACTIVE);
        searchableMenuNode.classList.add(MAP_NAMESPACE.STR_ACTIVE);
        populateOptions();
      }
    );
  } else if (filteredArray.length !== 0 && store.searchable.state.searchedKeyword.length !== 0) {
    store.searchable.setState(
      () => {
        store.searchable.state.isDropdownActive = MAP_NAMESPACE.BOOL_TRUE;
      },
      () => {
        store.searchable.state.menuListContainer.innerHTML = `${filteredArray.join("")}`;
        searchableMenuNode.classList.add(MAP_NAMESPACE.STR_ACTIVE);
      }
    );
  } else {
    return;
  }
};

const filterDropMenu = searchableMenuNode => {
  const keyword = store.searchable.state.searchedKeyword;
  const listOfLocations = store.searchable.state.orignalListOfLocations;
  const filteredArray = [];

  for (let i = 0; i < listOfLocations.length; i++) {
    if (listOfLocations[i].children[0].innerText.trim().toLowerCase().includes(keyword.trim().toLowerCase())) {
      filteredArray.push(listOfLocations[i].outerHTML);
      continue;
    }

    const locationItemsList = listOfLocations[i].children[1].children;

    const mostParentClone = listOfLocations[i].cloneNode(MAP_NAMESPACE.BOOL_TRUE);
    mostParentClone.children[1].innerHTML = "";

    for (let k = 0; k < locationItemsList.length; k++) {
      if (locationItemsList[k].lastElementChild.innerText.trim().toLowerCase().includes(keyword.trim().toLowerCase())) {
        mostParentClone.children[1].innerHTML += locationItemsList[k].outerHTML;
      } else {
        continue;
      }
    }

    if (mostParentClone.children[1].innerHTML.length > 0) filteredArray.push(mostParentClone.outerHTML);
  }

  renderFilterResultInDOM(filteredArray, searchableMenuNode);
};

const regionSelectionHandler = (event, node) => {
  event.stopPropagation();

  const getter = node.getAttribute(MAP_NAMESPACE.STR_SELECTED);

  store.searchable.setState(
    () => {
      if (getter === MAP_NAMESPACE.STR_FALSE) {
        const array = [];

        for (let i = 0; i < [...node.nextElementSibling.children].length; i++) {
          const location = node.nextElementSibling.children[i].lastElementChild
            .getAttribute(MAP_NAMESPACE.STR_VALUE)
            .trim();

          array.push(location);
        }

        store.searchable.state.selectionList = [...new Set([...store.searchable.state.selectionList, ...array])];
      } else {
        for (let i = 0; i < [...node.nextElementSibling.children].length; i++) {
          const location = node.nextElementSibling.children[i].lastElementChild
            .getAttribute(MAP_NAMESPACE.STR_VALUE)
            .trim();
          if (store.searchable.state.selectionList.includes(location)) {
            store.searchable.state.selectionList = store.searchable.state.selectionList.filter(
              item => item !== location
            );
          }
        }
      }
    },

    () => {
      if (getter === MAP_NAMESPACE.STR_FALSE) {
        applyCheckBox(node.children);

        for (let i = 0; i < node.nextElementSibling.children.length; i++) {
          applyCheckBox(node.nextElementSibling.children[i].children);
          node.nextElementSibling.children[i].setAttribute(MAP_NAMESPACE.STR_SELECTED, MAP_NAMESPACE.STR_TRUE);
        }
      } else {
        removeCheckBox(node.children);

        for (let i = 0; i < node.nextElementSibling.children.length; i++) {
          removeCheckBox(node.nextElementSibling.children[i].children);
          node.nextElementSibling.children[i].setAttribute(MAP_NAMESPACE.STR_SELECTED, MAP_NAMESPACE.STR_FALSE);
        }
      }

      node.setAttribute(
        MAP_NAMESPACE.STR_SELECTED,
        getter === MAP_NAMESPACE.STR_TRUE ? MAP_NAMESPACE.STR_FALSE : MAP_NAMESPACE.STR_TRUE
      );

      store.searchable.state.searchableWrapperNode.setAttribute(
        MAP_NAMESPACE.STR_VALUE,
        store.searchable.state.selectionList.join(";")
      );
    },
    () => {
      store.searchable.state.orignalListOfLocations = [...store.searchable.state.orignalListOfLocations].map(item => {
        if (item.children[0].id === node.id) {
          return node.parentElement;
        } else {
          return item;
        }
      });
    }
  );
};

const LocationSelectionHandler = (event, node) => {
  event.stopPropagation();

  const getter = node.getAttribute(MAP_NAMESPACE.STR_SELECTED);

  store.searchable.setState(
    () => {
      const location = node.lastElementChild.getAttribute(MAP_NAMESPACE.STR_VALUE).trim();

      if (!store.searchable.state.selectionList.includes(location)) {
        store.searchable.state.selectionList.push(location);
      } else {
        store.searchable.state.selectionList = store.searchable.state.selectionList.filter(item => item !== location);
      }
    },

    () => {
      if (getter === MAP_NAMESPACE.STR_FALSE) {
        applyCheckBox(node.children);
      } else {
        removeCheckBox(node.children);
      }

      node.setAttribute(
        MAP_NAMESPACE.STR_SELECTED,
        getter === MAP_NAMESPACE.STR_FALSE ? MAP_NAMESPACE.STR_TRUE : MAP_NAMESPACE.STR_FALSE
      );

      if (shouldRegionBeChecked(node)) {
        node.parentElement.previousElementSibling.setAttribute(MAP_NAMESPACE.STR_SELECTED, MAP_NAMESPACE.STR_TRUE);
        applyCheckBox(node.parentElement.previousElementSibling.children);
      } else {
        node.parentElement.previousElementSibling.setAttribute(MAP_NAMESPACE.STR_SELECTED, MAP_NAMESPACE.STR_FALSE);
        removeCheckBox(node.parentElement.previousElementSibling.children);
      }

      store.searchable.state.searchableWrapperNode.setAttribute(
        MAP_NAMESPACE.STR_VALUE,
        store.searchable.state.selectionList.join(";")
      );
    }
  );
};

window.onload = () => {
  const inputNode = $(store.searchable.state.searchableWrapperNode, MAP_NAMESPACE.CLASS_INPUT);
  const searchableMenuNode = $(store.searchable.state.searchableWrapperNode, MAP_NAMESPACE.CLASS_SEARCHABLE_MENU);

  document.body.addEventListener(MAP_NAMESPACE.EVENT_CLICK, () => {
    store.searchable.setState(
      () => {
        store.searchable.state.isDropdownActive = MAP_NAMESPACE.BOOL_FALSE;
        store.searchable.state.searchedKeyword = "";
      },
      () => {
        searchableMenuNode.classList.remove(MAP_NAMESPACE.STR_ACTIVE);
        store.searchable.state.errorStatusNode.classList.remove(MAP_NAMESPACE.STR_ACTIVE);

        const selectionListArraySize = store.searchable.state.selectionList.length;

        if (selectionListArraySize === 0) {
          inputNode.setAttribute(MAP_NAMESPACE.STR_VALUE, "");
          inputNode.value = "";
        } else if (selectionListArraySize === 1) {
          inputNode.setAttribute(MAP_NAMESPACE.STR_VALUE, `${store.searchable.state.selectionList[0]}`);
          inputNode.value = `${store.searchable.state.selectionList[0]}`;
        } else {
          inputNode.setAttribute(
            MAP_NAMESPACE.STR_VALUE,
            `${store.searchable.state.selectionList[0]} +${store.searchable.state.selectionList.length - 1}`
          );
          inputNode.value = `${store.searchable.state.selectionList[0]} +${
            store.searchable.state.selectionList.length - 1
          }`;
        }
      }
    );
  });

  $(store.searchable.state.searchableWrapperNode, MAP_NAMESPACE.CLASS_SELECT_FIELD).addEventListener(
    MAP_NAMESPACE.EVENT_CLICK,
    event => {
      event.stopPropagation();

      store.searchable.setState(
        () => {
          store.searchable.state.isDropdownActive = MAP_NAMESPACE.BOOL_TRUE;
          store.searchable.state.searchedKeyword = "";
        },
        () => {
          searchableMenuNode.classList.add(MAP_NAMESPACE.STR_ACTIVE);
          inputNode.focus();

          inputNode.setAttribute(MAP_NAMESPACE.STR_VALUE, "");
          inputNode.value = "";

          if (store.searchable.state.selectionList.length === 0) {
            populateOptions();
          }
        }
      );
    }
  );

  inputNode.addEventListener(MAP_NAMESPACE.EVENT_INPUT, event => {
    debounce(() => {
      store.searchable.setState(
        () => {
          store.searchable.state.searchedKeyword = event.target.value;
        },
        () => {
          inputNode.setAttribute(MAP_NAMESPACE.STR_VALUE, event.target.value);
          inputNode.value = event.target.value;

          filterDropMenu(searchableMenuNode);
        }
      );
    }, store.delay);
  });
};
