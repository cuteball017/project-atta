"use client";

import { useState } from 'react';
import styles from './index.module.css';
import NavBar from "@/components/navBar/navBar";


interface Item {
  id: number;
  number: number;
  name: string;
  feature: string;
  others: string;
}

export default function ItemList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('すべて');
  const [sortOrder, setSortOrder] = useState('登録順');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null); 

  const items: Item[] = [
    { id: 1, number: 10, name: '腕時計', feature: '防水', others: '2022年製' },
    { id: 2, number: 9, name: '財布', feature: '革製', others: '黒色、ジッパー付き' },
    { id: 3, number: 2, name: 'スマートフォン', feature: '割れた画面', others: '64GB、シルバー' },
    { id: 4, number: 15, name: 'カメラ', feature: '一眼レフ', others: 'Nikon, 黒色' },
    { id: 5, number: 8, name: 'ノートパソコン', feature: '薄型', others: '13インチ、MacBook Air' },
    { id: 6, number: 3, name: 'イヤホン', feature: 'ワイヤレス', others: '白色、充電ケース付き' },
  ];

  const filteredItems = items.filter((item: Item) => {
    return (
      (filter === 'すべて' || item.feature.includes(filter)) &&  
      (
        item.name.includes(searchTerm) ||
        item.number.toString().includes(searchTerm) ||  
        item.feature.includes(searchTerm) 
      )
    );
  });  

  const openModal = (item: Item) => {
    setSelectedItem(item); 
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null); 
  };

  return (
    <div>
      <div className={styles.container}>
        <h1 className={styles.heading}>一覧</h1>
        
        <div className={styles.searchInput}>
          <input
            type="text"
            placeholder="拾得物をさがす"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filterButtons}>
          <button className={filter === 'すべて' ? styles.active : ''} onClick={() => setFilter('すべて')}>すべて</button>
          <button className={styles.filterButton}>絞り込み</button>
          <button className={styles.filterButton} onClick={() => setSortOrder('登録順')}>登録順</button>
        </div>

        <div className={styles.itemsGrid}>
          {filteredItems.map((item: Item) => (
            <div key={item.id} className={styles.itemCard} onClick={() => openModal(item)}>
              <p>No. {item.number}</p>
              <p>名称: {item.name}</p>
              <p>特徴: {item.feature}</p>
              <p>その他: {item.others}</p>
            </div>
          ))}
        </div>

        {isModalOpen && selectedItem && (
          <>
            <div className={styles.modalOverlay} onClick={closeModal}></div>
            <div className={styles.modal}>
              <button className={styles.modalCloseButton} onClick={closeModal}>×</button>
              <div className={styles.modalImage}></div>
              <div className={styles.modalContent}>
                <p>No. {selectedItem.number}</p>
                <p>名称: {selectedItem.name}</p>
                <p>特徴: {selectedItem.feature}</p>
                <p>その他: {selectedItem.others}</p>
              </div>
              <div className={styles.completeButton}>お渡し完了</div>
            </div>
          </>
        )}
      </div>
      <div className={styles.nav}><NavBar/></div>
    </div>
  );
}
